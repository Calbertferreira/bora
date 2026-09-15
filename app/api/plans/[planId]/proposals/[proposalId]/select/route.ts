import { and, eq, ne } from "drizzle-orm";
import { getCurrentAccess, hasAnyRole, isAccessBlocked } from "@/lib/access";
import { getDb } from "@/lib/db";
import { auditLogs, planProposals, plans, planStatusHistory } from "@/lib/db/schema";

export async function POST(_: Request, context: { params: Promise<{ planId: string; proposalId: string }> }) {
  const access = await getCurrentAccess();
  if (!access) return Response.json({ error: "Não autenticado." }, { status: 401 });
  if (!access.profile || isAccessBlocked(access.profile.status) || !hasAnyRole(access.roles, ["CLIENT"])) return Response.json({ error: "Acesso restrito ao cliente." }, { status: 403 });
  const { planId, proposalId } = await context.params;
  const db = getDb();
  const [plan] = await db.select({ id: plans.id }).from(plans).where(and(eq(plans.id, planId), eq(plans.userId, access.session.user.id))).limit(1);
  if (!plan) return Response.json({ error: "Planejamento não encontrado." }, { status: 404 });
  const [proposal] = await db.select().from(planProposals).where(and(eq(planProposals.id, proposalId), eq(planProposals.planId, planId), eq(planProposals.status, "PUBLISHED"))).limit(1);
  if (!proposal) return Response.json({ error: "Esta proposta não está disponível." }, { status: 400 });
  await db.update(planProposals).set({ status: "REJECTED", updatedAt: new Date() }).where(and(eq(planProposals.planId, planId), ne(planProposals.id, proposalId), eq(planProposals.status, "PUBLISHED")));
  await db.update(planProposals).set({ status: "SELECTED", updatedAt: new Date() }).where(eq(planProposals.id, proposalId));
  await db.update(plans).set({ status: "SELECTED", updatedAt: new Date() }).where(eq(plans.id, planId));
  await db.insert(planStatusHistory).values({ planId, status: "SELECTED", note: `Proposta escolhida: ${proposal.title}.`, changedBy: access.session.user.id });
  await db.insert(auditLogs).values({ actorUserId: access.session.user.id, targetUserId: access.session.user.id, action: "PLAN_PROPOSAL_SELECTED", details: { planId, proposalId } });
  return Response.json({ ok: true });
}
