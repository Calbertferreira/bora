import { desc, eq } from "drizzle-orm";
import { CalendarDays, ChevronRight, MapPin, Plus, Users } from "lucide-react";
import { SignoutButton } from "@/components/auth/signout-button";
import { requirePageRole } from "@/lib/access";
import { getDb } from "@/lib/db";
import { eventPackages, plans, supplierProfiles } from "@/lib/db/schema";
import { planStatusLabels, type PlanStatus } from "@/lib/plans";

const packageStatusLabels = { SENT: "Enviado", ACCEPTED: "Aceito", CANCELLED: "Cancelado", DRAFT: "Rascunho" } as const;

export default async function ClientPlansPage() {
  const access = await requirePageRole(["CLIENT"]);
  const db = getDb();
  const [clientPlans, supplierEvents] = await Promise.all([
    db.select().from(plans).where(eq(plans.userId, access.session.user.id)).orderBy(desc(plans.updatedAt)),
    db.select({ id: eventPackages.id, title: eventPackages.eventTitle, type: eventPackages.eventType, eventDate: eventPackages.eventDate, location: eventPackages.eventLocation, status: eventPackages.status, updatedAt: eventPackages.updatedAt, supplierName: supplierProfiles.businessName }).from(eventPackages).innerJoin(supplierProfiles, eq(supplierProfiles.userId, eventPackages.organizerSupplierId)).where(eq(eventPackages.clientUserId, access.session.user.id)).orderBy(desc(eventPackages.updatedAt)),
  ]);
  const rows = [
    ...clientPlans.map((plan) => ({ id: plan.id, title: plan.title, subtitle: plan.occasion || (plan.type === "celebrate" ? "Festejar" : plan.type === "relax" ? "Relaxar" : "Sugestão"), date: plan.startDate, location: [plan.city, plan.state].filter(Boolean).join("/"), guests: plan.guests, status: planStatusLabels[plan.status as PlanStatus], statusKey: plan.status.toLowerCase(), origin: "CLIENT" as const, updatedAt: plan.updatedAt, href: `/cliente/planejamentos/${plan.id}` })),
    ...supplierEvents.filter((event) => event.status !== "DRAFT").map((event) => ({ id: event.id, title: event.title, subtitle: `${event.type} · Organizado por ${event.supplierName}`, date: event.eventDate, location: event.location || "Local a definir", guests: null, status: packageStatusLabels[event.status], statusKey: event.status.toLowerCase(), origin: "SUPPLIER" as const, updatedAt: event.updatedAt, href: `/cliente/pacotes/${event.id}/contrato` })),
  ].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

  return <main className="client-page">
    <header className="dashboard-nav"><a className="brand" href="/">bora<span>.</span></a><nav><a href="/cliente/pacotes">Meus pacotes</a><a href="/painel">Meu painel</a></nav><div><span>{access.session.user.email}</span><SignoutButton /></div></header>
    <section className="client-shell">
      <div className="client-heading"><div><span>MINHA JORNADA</span><h1>Meus eventos</h1><p>Planejamentos criados por você e eventos enviados por fornecedores, reunidos em uma única lista.</p></div><a className="new-plan-button" href="/planejar"><Plus size={17} /> Novo planejamento</a></div>
      {rows.length ? <div className="plan-list">{rows.map((item) => <a className="plan-card" href={item.href} key={`${item.origin}-${item.id}`}>
        <div className="plan-card-top"><div className="plan-card-badges"><span className={`plan-status plan-status-${item.statusKey}`}>{item.status}</span><span className={`origin-badge origin-${item.origin.toLowerCase()}`}>{item.origin === "CLIENT" ? "Cadastrado pelo cliente" : "Cadastrado pelo fornecedor"}</span></div><small>Atualizado em {item.updatedAt.toLocaleDateString("pt-BR")}</small></div>
        <h2>{item.title}</h2><p className="plan-subtitle">{item.subtitle}</p>
        <div className="plan-facts"><span><MapPin size={15} /> {item.location || "Local a definir"}</span><span><CalendarDays size={15} /> {item.date ? new Date(`${item.date}T00:00:00Z`).toLocaleDateString("pt-BR", { timeZone: "UTC" }) : "A definir"}</span>{item.guests !== null && <span><Users size={15} /> {item.guests ?? "—"} pessoas</span>}</div>
        <ChevronRight />
      </a>)}</div> : <div className="empty-plans"><span><CalendarDays /></span><h2>Seu primeiro momento começa aqui</h2><p>Conte o que deseja fazer e o BORA organiza as informações para você.</p><a href="/planejar">Criar planejamento</a></div>}
    </section>
  </main>;
}
