import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { getCurrentAccess, hasAnyRole, isAccessBlocked } from "@/lib/access";
import { getDb } from "@/lib/db";
import { auditLogs, planProposalItems, planProposals, plans, planStatusHistory, supplierListings } from "@/lib/db/schema";

const schema = z.object({ title: z.string().trim().min(3).max(120), description: z.string().trim().max(1000).optional().default(""), validUntil: z.iso.date().optional().or(z.literal("")), listingIds: z.array(z.uuid()).min(1).max(30) });

export async function POST(request: Request, context: { params: Promise<{ planId: string }> }) {
  const access = await getCurrentAccess();
  if (!access) return Response.json({ error: "Não autenticado." }, { status: 401 });
  if (!access.profile || isAccessBlocked(access.profile.status) || !hasAnyRole(access.roles, ["ADMIN", "STAFF"])) return Response.json({ error: "Acesso restrito à equipe BORA." }, { status: 403 });
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Informe o título e selecione pelo menos uma oferta." }, { status: 400 });
  const { planId } = await context.params;
  const db = getDb();
  const [plan] = await db.select().from(plans).where(eq(plans.id, planId)).limit(1);
  if (!plan) return Response.json({ error: "Planejamento não encontrado." }, { status: 404 });
  const uniqueIds = [...new Set(parsed.data.listingIds)];
  const listings = await db.select().from(supplierListings).where(and(inArray(supplierListings.id, uniqueIds), eq(supplierListings.status, "PUBLISHED")));
  if (listings.length !== uniqueIds.length) return Response.json({ error: "Uma das ofertas não está mais disponível." }, { status: 400 });
  const days = plan.startDate && plan.endDate ? Math.max(1, Math.round((Date.parse(`${plan.endDate}T00:00:00Z`) - Date.parse(`${plan.startDate}T00:00:00Z`)) / 86400000) + 1) : 1;
  const items = listings.map((listing) => ({ ...listing, calculatedPrice: listing.priceUnit === "PER_PERSON" ? listing.priceCents * (plan.guests ?? 1) : listing.priceUnit === "PER_DAY" ? listing.priceCents * days : listing.priceCents }));
  const totalCents = items.reduce((sum, item) => sum + item.calculatedPrice, 0);
  let proposalId = "";
  try {
    const [proposal] = await db.insert(planProposals).values({ planId, title: parsed.data.title, description: parsed.data.description || null, totalCents, status: "PUBLISHED", validUntil: parsed.data.validUntil || null, createdBy: access.session.user.id }).returning({ id: planProposals.id });
    proposalId = proposal.id;
    await db.insert(planProposalItems).values(items.map((item) => ({ proposalId, listingId: item.id, supplierUserId: item.supplierUserId, name: item.name, description: item.description, priceCents: item.calculatedPrice })));
    await db.update(plans).set({ status: "PROPOSALS_AVAILABLE", updatedAt: new Date() }).where(eq(plans.id, planId));
    await db.insert(planStatusHistory).values({ planId, status: "PROPOSALS_AVAILABLE", note: `Nova proposta disponível: ${parsed.data.title}.`, changedBy: access.session.user.id });
    await db.insert(auditLogs).values({ actorUserId: access.session.user.id, targetUserId: plan.userId, action: "PLAN_PROPOSAL_PUBLISHED", details: { planId, proposalId, totalCents } });
    return Response.json({ ok: true, proposalId }, { status: 201 });
  } catch (error) {
    if (proposalId) await db.delete(planProposals).where(eq(planProposals.id, proposalId));
    console.error("[plan/proposals]", error); return Response.json({ error: "Não foi possível publicar a proposta." }, { status: 500 });
  }
}
