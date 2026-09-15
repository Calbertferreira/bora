import { desc, eq } from "drizzle-orm";
import { PlanStatusControl } from "@/components/admin/plan-status-control";
import { requirePageRole } from "@/lib/access";
import { getDb } from "@/lib/db";
import { plans, users } from "@/lib/db/schema";
import { planStatusLabels, type PlanStatus } from "@/lib/plans";

export default async function AdminPlansPage() {
  await requirePageRole(["ADMIN", "STAFF"]);
  const rows = await getDb().select({ id: plans.id, title: plans.title, city: plans.city, state: plans.state, guests: plans.guests, startDate: plans.startDate, budgetLabel: plans.budgetLabel, status: plans.status, updatedAt: plans.updatedAt, clientName: users.name, clientEmail: users.email }).from(plans).leftJoin(users, eq(users.id, plans.userId)).orderBy(desc(plans.updatedAt));
  return <main className="admin-shell"><div className="admin-heading"><div><span>OPERAÇÃO</span><h1>Planejamentos dos clientes</h1><p>Analise as solicitações e mantenha o cliente informado sobre cada etapa.</p></div><b>{rows.length} planejamentos</b></div>
    <section className="admin-table-card"><div className="table-scroll"><table className="admin-table plans-admin-table"><thead><tr><th>Cliente e momento</th><th>Quando e onde</th><th>Informações</th><th>Andamento</th></tr></thead><tbody>{rows.length ? rows.map((plan) => <tr key={plan.id}><td><a className="admin-plan-link" href={`/admin/planejamentos/${plan.id}`}>{plan.title}</a><small>{plan.clientName} · {plan.clientEmail}</small><a className="build-proposal-link" href={`/admin/planejamentos/${plan.id}`}>Montar proposta →</a></td><td><strong>{plan.startDate ? new Date(`${plan.startDate}T00:00:00Z`).toLocaleDateString("pt-BR", { timeZone: "UTC" }) : "A definir"}</strong><small>{plan.city}{plan.state ? `/${plan.state}` : ""}</small></td><td><strong>{plan.guests ?? "—"} pessoas</strong><small>{plan.budgetLabel}</small><span className={`plan-status plan-status-${plan.status.toLowerCase()}`}>{planStatusLabels[plan.status as PlanStatus]}</span></td><td><PlanStatusControl planId={plan.id} currentStatus={plan.status as PlanStatus} /></td></tr>) : <tr><td colSpan={4} className="empty-cell">Nenhum planejamento recebido.</td></tr>}</tbody></table></div></section>
  </main>;
}
