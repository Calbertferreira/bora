import { eq } from "drizzle-orm";
import { z } from "zod";
import { getCurrentAccess, hasAnyRole, isAccessBlocked } from "@/lib/access";
import { getDb } from "@/lib/db";
import { auditLogs, sessions, userProfiles, users } from "@/lib/db/schema";

const statusSchema = z.object({ status: z.enum(["ACTIVE", "SUSPENDED", "BLOCKED"]) });

export async function PATCH(request: Request, context: { params: Promise<{ userId: string }> }) {
  const access = await getCurrentAccess();
  if (!access) return Response.json({ error: "Não autenticado." }, { status: 401 });
  if (!access.profile || isAccessBlocked(access.profile.status) || !hasAnyRole(access.roles, ["ADMIN"])) {
    return Response.json({ error: "Acesso restrito a administradores." }, { status: 403 });
  }

  const parsed = statusSchema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Status inválido." }, { status: 400 });
  const { userId } = await context.params;
  if (userId === access.session.user.id && parsed.data.status !== "ACTIVE") {
    return Response.json({ error: "Você não pode bloquear sua própria conta." }, { status: 400 });
  }

  try {
    const db = getDb();
    const [target] = await db.select({ id: users.id, email: users.email }).from(users).where(eq(users.id, userId)).limit(1);
    if (!target) return Response.json({ error: "Usuário não encontrado." }, { status: 404 });
    const updated = await db.update(userProfiles).set({ status: parsed.data.status, updatedAt: new Date() }).where(eq(userProfiles.userId, userId)).returning({ userId: userProfiles.userId });
    if (!updated.length) return Response.json({ error: "Perfil não encontrado." }, { status: 404 });
    if (parsed.data.status !== "ACTIVE") await db.delete(sessions).where(eq(sessions.userId, userId));
    await db.insert(auditLogs).values({
      actorUserId: access.session.user.id,
      targetUserId: userId,
      action: "USER_STATUS_CHANGED",
      details: { status: parsed.data.status, email: target.email },
    });
    return Response.json({ ok: true, status: parsed.data.status });
  } catch (error) {
    console.error("[admin/users]", error);
    return Response.json({ error: "Não foi possível atualizar a conta." }, { status: 500 });
  }
}
