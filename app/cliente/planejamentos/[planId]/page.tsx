import { and, asc, eq, gte, ilike, inArray, isNull, or } from "drizzle-orm";
import { ArrowLeft, CalendarDays, Check, MapPin, Users } from "lucide-react";
import { notFound } from "next/navigation";
import { requirePageRole } from "@/lib/access";
import { ProposalSelectButton } from "@/components/client/proposal-select-button";
import { getDb } from "@/lib/db";
import { planProposalItems, planProposals, plans, planServices, planStatusHistory, supplierListingImages, supplierListings, supplierProfiles } from "@/lib/db/schema";
import { planStatusLabels, type PlanStatus } from "@/lib/plans";

export default async function ClientPlanDetailPage({ params }: { params: Promise<{ planId: string }> }) {
  const access = await requirePageRole(["CLIENT"]);
  const { planId } = await params;
  const db = getDb();
  const [plan] = await db.select().from(plans).where(and(eq(plans.id, planId), eq(plans.userId, access.session.user.id))).limit(1);
  if (!plan) notFound();
  const [services, history, listingRows] = await Promise.all([
    db.select().from(planServices).where(eq(planServices.planId, plan.id)).orderBy(asc(planServices.createdAt)),
    db.select().from(planStatusHistory).where(eq(planStatusHistory.planId, plan.id)).orderBy(asc(planStatusHistory.createdAt)),
    db.select({ id: supplierListings.id, name: supplierListings.name, description: supplierListings.description, priceCents: supplierListings.priceCents, priceUnit: supplierListings.priceUnit, city: supplierListings.city, state: supplierListings.state, capacity: supplierListings.capacity, businessName: supplierProfiles.businessName, imageUrl: supplierListingImages.url })
      .from(supplierListings)
      .innerJoin(supplierProfiles, eq(supplierProfiles.userId, supplierListings.supplierUserId))
      .leftJoin(supplierListingImages, eq(supplierListingImages.listingId, supplierListings.id))
      .where(and(eq(supplierListings.status, "PUBLISHED"), plan.guests ? or(isNull(supplierListings.capacity), gte(supplierListings.capacity, plan.guests)) : undefined, plan.city ? or(isNull(supplierListings.city), ilike(supplierListings.city, plan.city)) : undefined))
      .limit(24),
  ]);
  const suggestions = [...new Map(listingRows.map((item) => [item.id, item])).values()];
  const proposals = await db.select().from(planProposals).where(and(eq(planProposals.planId, plan.id), or(eq(planProposals.status, "PUBLISHED"), eq(planProposals.status, "SELECTED")))).orderBy(asc(planProposals.createdAt));
  const proposalItems = proposals.length ? await db.select().from(planProposalItems).where(inArray(planProposalItems.proposalId, proposals.map((proposal) => proposal.id))) : [];
  const formatDate = (value: string | null) => value ? new Date(`${value}T00:00:00Z`).toLocaleDateString("pt-BR", { timeZone: "UTC" }) : "A definir";
  const priceUnits = { PER_EVENT: "por evento", PER_PERSON: "por pessoa", PER_DAY: "por dia", STARTING_AT: "a partir de" } as const;

  return <main className="client-page"><section className="client-shell plan-detail-shell">
    <a className="back-link" href="/cliente/planejamentos"><ArrowLeft size={16} /> Meus planejamentos</a>
    <div className="plan-detail-heading"><div><span>PLANEJAMENTO</span><h1>{plan.title}</h1><p>Criado em {plan.createdAt.toLocaleDateString("pt-BR")}</p></div><span className={`plan-status plan-status-${plan.status.toLowerCase()}`}>{planStatusLabels[plan.status as PlanStatus]}</span></div>
    <div className="plan-detail-grid">
      <section className="plan-overview"><h2>Preferências</h2>{plan.idea && <blockquote>{plan.idea}</blockquote>}<div className="detail-facts"><div><MapPin /><span>Local</span><strong>{plan.city}{plan.state ? `/${plan.state}` : ""}</strong></div><div><CalendarDays /><span>Período</span><strong>{formatDate(plan.startDate)}{plan.endDate && plan.endDate !== plan.startDate ? ` a ${formatDate(plan.endDate)}` : ""}</strong></div><div><Users /><span>Pessoas</span><strong>{plan.guests ?? "A definir"}</strong></div><div><span className="currency">R$</span><span>Investimento</span><strong>{plan.budgetLabel ?? "A definir"}</strong></div></div>{services.length > 0 && <div className="requested-services"><h3>Serviços desejados</h3><div>{services.map((service) => <span key={service.id}><Check size={13} /> {service.name}</span>)}</div></div>}</section>
      <aside className="plan-timeline"><h2>Acompanhamento</h2>{history.map((item) => <div className="timeline-item" key={item.id}><i /><div><strong>{planStatusLabels[item.status as PlanStatus]}</strong><small>{item.createdAt.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}</small>{item.note && <p>{item.note}</p>}</div></div>)}</aside>
    </div>
    <section className="plan-results"><div><span>PROPOSTAS BORA</span><h2>Pacotes preparados para você</h2><p>Compare os itens, o valor total e escolha a opção que combina com seu momento.</p></div>{proposals.length ? <div className="proposal-grid">{proposals.map((proposal) => <article className={proposal.status === "SELECTED" ? "selected" : ""} key={proposal.id}><div className="proposal-heading"><div><small>{proposal.status === "SELECTED" ? "ESCOLHIDA" : "PROPOSTA"}</small><h3>{proposal.title}</h3></div><strong>{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(proposal.totalCents / 100)}</strong></div>{proposal.description && <p>{proposal.description}</p>}<ul>{proposalItems.filter((item) => item.proposalId === proposal.id).map((item) => <li key={item.id}><span>{item.name}</span><strong>{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(item.priceCents / 100)}</strong></li>)}</ul>{proposal.validUntil && <small>Válida até {new Date(`${proposal.validUntil}T00:00:00Z`).toLocaleDateString("pt-BR", { timeZone: "UTC" })}</small>}{proposal.status === "PUBLISHED" && <ProposalSelectButton planId={plan.id} proposalId={proposal.id} />}</article>)}</div> : <div className="results-waiting"><h3>A equipe BORA está preparando seus pacotes</h3><p>Você será informado quando as propostas estiverem prontas para comparação.</p></div>}</section>
    <section className="plan-results"><div><span>VITRINE</span><h2>Opções compatíveis</h2><p>Ofertas publicadas que atendem ao local e à quantidade de pessoas informados.</p></div>{suggestions.length ? <div className="result-grid">{suggestions.map((item) => <article key={item.id}>{item.imageUrl ? <img src={item.imageUrl} alt={item.name} /> : <div className="result-placeholder">bora?</div>}<div><small>{item.businessName}</small><h3>{item.name}</h3><p>{item.description}</p><strong>{priceUnits[item.priceUnit] === "a partir de" ? "A partir de " : ""}{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(item.priceCents / 100)} <small>{priceUnits[item.priceUnit] !== "a partir de" ? priceUnits[item.priceUnit] : ""}</small></strong></div></article>)}</div> : <div className="results-waiting"><h3>Novas opções serão publicadas em breve</h3><p>A equipe BORA continua ampliando o catálogo de fornecedores.</p></div>}</section>
  </section></main>;
}
