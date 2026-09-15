import { getCurrentAccess, hasAnyRole, isAccessBlocked } from "@/lib/access";
import { getDb } from "@/lib/db";
import { auditLogs, plans, planServices, planStatusHistory } from "@/lib/db/schema";
import { planCreateSchema, planTitle } from "@/lib/plans";

export async function POST(request: Request) {
  const access = await getCurrentAccess();
  if (!access) return Response.json({ error: "Entre na sua conta para criar o planejamento.", code: "AUTH_REQUIRED" }, { status: 401 });
  if (!access.profile || isAccessBlocked(access.profile.status) || !hasAnyRole(access.roles, ["CLIENT"])) {
    return Response.json({ error: "Sua conta não possui acesso de cliente." }, { status: 403 });
  }
  const parsed = planCreateSchema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Revise os dados do planejamento.", fields: parsed.error.flatten().fieldErrors }, { status: 400 });

  const data = parsed.data;
  const db = getDb();
  try {
    const [plan] = await db.insert(plans).values({
      userId: access.session.user.id,
      type: data.type,
      title: planTitle(data.type, data.occasion),
      occasion: data.occasion || null,
      idea: data.idea || null,
      city: data.city,
      state: data.state || null,
      startDate: data.startDate,
      endDate: data.endDate || data.startDate,
      guests: data.guests,
      budgetLabel: data.budgetLabel,
      status: "SUBMITTED",
    }).returning({ id: plans.id });
    if (data.services.length) await db.insert(planServices).values([...new Set(data.services)].map((name) => ({ planId: plan.id, name })));
    await db.insert(planStatusHistory).values({ planId: plan.id, status: "SUBMITTED", changedBy: access.session.user.id, note: "Planejamento criado pelo cliente." });
    await db.insert(auditLogs).values({ actorUserId: access.session.user.id, targetUserId: access.session.user.id, action: "PLAN_CREATED", details: { planId: plan.id, type: data.type } });
    return Response.json({ ok: true, planId: plan.id }, { status: 201 });
  } catch (error) {
    console.error("[plans/create]", error);
    return Response.json({ error: "Não foi possível salvar o planejamento." }, { status: 500 });
  }
}
