import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { ProposalBuilder } from "@/components/admin/proposal-builder";
import { requirePageRole } from "@/lib/access";
import { getDb } from "@/lib/db";
import { plans, supplierListings, supplierProfiles, users } from "@/lib/db/schema";

export default async function BuildProposalPage({ params }: { params: Promise<{ planId: string }> }) {
  await requirePageRole(["ADMIN", "STAFF"]); const { planId } = await params; const db = getDb();
  const [plan] = await db.select({ id: plans.id, title: plans.title, city: plans.city, guests: plans.guests, startDate: plans.startDate, endDate: plans.endDate, clientName: users.name }).from(plans).leftJoin(users, eq(users.id, plans.userId)).where(eq(plans.id, planId)).limit(1);
  if (!plan) notFound();
  const listings = await db.select({ id: supplierListings.id, name: supplierListings.name, priceCents: supplierListings.priceCents, priceUnit: supplierListings.priceUnit, businessName: supplierProfiles.businessName }).from(supplierListings).innerJoin(supplierProfiles, eq(supplierProfiles.userId, supplierListings.supplierUserId)).where(and(eq(supplierListings.status, "PUBLISHED"), eq(supplierProfiles.approvalStatus, "ACTIVE")));
  const unit = { PER_EVENT: "por evento", PER_PERSON: "por pessoa", PER_DAY: "por dia", STARTING_AT: "a partir de" } as const;
  const offers = listings.map((item) => ({ id: item.id, name: item.name, businessName: item.businessName, priceLabel: `${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(item.priceCents / 100)} ${unit[item.priceUnit]}` }));
  return <main className="admin-shell"><a className="back-link" href="/admin/planejamentos">← Voltar à fila</a><div className="admin-heading"><div><span>MONTAR RESULTADO</span><h1>{plan.title}</h1><p>{plan.clientName} · {plan.city} · {plan.guests} pessoas</p></div></div><section className="invite-card"><ProposalBuilder planId={plan.id} offers={offers} /></section></main>;
}
