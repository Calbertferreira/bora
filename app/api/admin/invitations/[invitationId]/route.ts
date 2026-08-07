import { and, eq } from "drizzle-orm";
import { getCurrentAccess, hasAnyRole, isAccessBlocked } from "@/lib/access";
import { getDb } from "@/lib/db";
import { auditLogs, internalInvitations } from "@/lib/db/schema";

export async function DELETE(_request: Request, context: { params: Promise<{ invitationId: string }> }) {
  const access = await getCurrentAccess();
  if (!access) return Response.json({ error: "Não autenticado." }, { status: 401 });
  if (!access.profile || isAccessBlocked(access.profile.status) || !hasAnyRole(access.roles, ["ADMIN"])) {
    return Response.json({ error: "Acesso restrito a administradores." }, { status: 403 });
  }
  const { invitationId } = await context.params;

  try {
    const db = getDb();
    const [invitation] = await db.update(internalInvitations).set({
      status: "REVOKED",
      updatedAt: new Date(),
    }).where(and(
      eq(internalInvitations.id, invitationId),
      eq(internalInvitations.status, "PENDING"),
    )).returning({ id: internalInvitations.id, email: internalInvitations.email, role: internalInvitations.role });
    if (!invitation) return Response.json({ error: "Convite pendente não encontrado." }, { status: 404 });
    await db.insert(auditLogs).values({
      actorUserId: access.session.user.id,
      action: "INTERNAL_INVITATION_REVOKED",
      details: { invitationId, email: invitation.email, role: invitation.role },
    });
    return Response.json({ ok: true });
  } catch (error) {
    console.error("[admin/invitations/revoke]", error);
    return Response.json({ error: "Não foi possível revogar o convite." }, { status: 500 });
  }
}
