import { desc, eq } from "drizzle-orm";
import { CalendarDays, ChevronRight, MapPin, Plus, Users } from "lucide-react";
import { SignoutButton } from "@/components/auth/signout-button";
import { requirePageRole } from "@/lib/access";
import { getDb } from "@/lib/db";
import { plans } from "@/lib/db/schema";
import { planStatusLabels, type PlanStatus } from "@/lib/plans";

export default async function ClientPlansPage() {
  const access = await requirePageRole(["CLIENT"]);
  const rows = await getDb().select().from(plans).where(eq(plans.userId, access.session.user.id)).orderBy(desc(plans.updatedAt));
  return <main className="client-page">
    <header className="dashboard-nav"><a className="brand" href="/">bora<span>.</span></a><nav><a href="/painel">Meu painel</a></nav><div><span>{access.session.user.email}</span><SignoutButton /></div></header>
    <section className="client-shell">
      <div className="client-heading"><div><span>MINHA JORNADA</span><h1>Meus planejamentos</h1><p>Acompanhe cada etapa dos seus momentos.</p></div><a className="new-plan-button" href="/planejar"><Plus size={17} /> Novo planejamento</a></div>
      {rows.length ? <div className="plan-list">{rows.map((plan) => <a className="plan-card" href={`/cliente/planejamentos/${plan.id}`} key={plan.id}>
        <div className="plan-card-top"><span className={`plan-status plan-status-${plan.status.toLowerCase()}`}>{planStatusLabels[plan.status as PlanStatus]}</span><small>Atualizado em {plan.updatedAt.toLocaleDateString("pt-BR")}</small></div>
        <h2>{plan.title}</h2>
        <div className="plan-facts"><span><MapPin size={15} /> {plan.city}{plan.state ? `/${plan.state}` : ""}</span><span><CalendarDays size={15} /> {plan.startDate ? new Date(`${plan.startDate}T00:00:00Z`).toLocaleDateString("pt-BR", { timeZone: "UTC" }) : "A definir"}</span><span><Users size={15} /> {plan.guests ?? "—"} pessoas</span></div>
        <ChevronRight />
      </a>)}</div> : <div className="empty-plans"><span><CalendarDays /></span><h2>Seu primeiro momento começa aqui</h2><p>Conte o que deseja fazer e o BORA organiza as informações para você.</p><a href="/planejar">Criar planejamento</a></div>}
    </section>
  </main>;
}
