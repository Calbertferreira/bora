import { eq } from "drizzle-orm";
import { z } from "zod";
import { getCurrentAccess, hasAnyRole, isAccessBlocked } from "@/lib/access";
import { getDb } from "@/lib/db";
import { auditLogs, supplierProfiles, users } from "@/lib/db/schema";

const approvalSchema = z.object({ approvalStatus: z.enum(["ACTIVE", "REJECTED", "UNDER_REVIEW"]) });

export async function PATCH(request: Request, context: { params: Promise<{ userId: string }> }) {
  const access = await getCurrentAccess();
  if (!access) return Response.json({ error: "Não autenticado." }, { status: 401 });
  if (!access.profile || isAccessBlocked(access.profile.status) || !hasAnyRole(access.roles, ["ADMIN"])) {
    return Response.json({ error: "Acesso restrito a administradores." }, { status: 403 });
  }

  const parsed = approvalSchema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Situação de aprovação inválida." }, { status: 400 });
  const { userId } = await context.params;

  try {
    const db = getDb();
    const [target] = await db.select({ email: users.email }).from(users).where(eq(users.id, userId)).limit(1);
    if (!target) return Response.json({ error: "Fornecedor não encontrado." }, { status: 404 });
    const updated = await db.update(supplierProfiles).set({
      approvalStatus: parsed.data.approvalStatus,
      updatedAt: new Date(),
    }).where(eq(supplierProfiles.userId, userId)).returning({ userId: supplierProfiles.userId });
    if (!updated.length) return Response.json({ error: "Perfil de fornecedor não encontrado." }, { status: 404 });
    await db.insert(auditLogs).values({
      actorUserId: access.session.user.id,
      targetUserId: userId,
      action: "SUPPLIER_APPROVAL_CHANGED",
      details: { approvalStatus: parsed.data.approvalStatus, email: target.email },
    });
    return Response.json({ ok: true, approvalStatus: parsed.data.approvalStatus });
  } catch (error) {
    console.error("[admin/suppliers]", error);
    return Response.json({ error: "Não foi possível atualizar o fornecedor." }, { status: 500 });
  }
}
