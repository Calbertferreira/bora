import { eq } from "drizzle-orm";
import { z } from "zod";
import { getCurrentAccess, hasAnyRole, isAccessBlocked } from "@/lib/access";
import { getDb } from "@/lib/db";
import { auditLogs, plans, planStatusHistory } from "@/lib/db/schema";
import { planStatuses } from "@/lib/plans";

const updateSchema = z.object({ status: z.enum(planStatuses), note: z.string().trim().max(500).optional().default("") });

export async function PATCH(request: Request, context: { params: Promise<{ planId: string }> }) {
  const access = await getCurrentAccess();
  if (!access) return Response.json({ error: "Não autenticado." }, { status: 401 });
  if (!access.profile || isAccessBlocked(access.profile.status) || !hasAnyRole(access.roles, ["ADMIN", "STAFF"])) return Response.json({ error: "Acesso restrito à equipe BORA." }, { status: 403 });
  const parsed = updateSchema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Andamento inválido." }, { status: 400 });
  const { planId } = await context.params;
  const db = getDb();
  const [updated] = await db.update(plans).set({ status: parsed.data.status, updatedAt: new Date() }).where(eq(plans.id, planId)).returning({ id: plans.id, userId: plans.userId });
  if (!updated) return Response.json({ error: "Planejamento não encontrado." }, { status: 404 });
  await db.insert(planStatusHistory).values({ planId, status: parsed.data.status, note: parsed.data.note || null, changedBy: access.session.user.id });
  await db.insert(auditLogs).values({ actorUserId: access.session.user.id, targetUserId: updated.userId, action: "PLAN_STATUS_CHANGED", details: { planId, status: parsed.data.status } });
  return Response.json({ ok: true, status: parsed.data.status });
}
