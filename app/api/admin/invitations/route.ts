import { randomUUID } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getCurrentAccess, hasAnyRole, isAccessBlocked } from "@/lib/access";
import { appBaseURL } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { auditLogs, internalInvitations, users, userRoles } from "@/lib/db/schema";
import { createInvitationToken, hashInvitationToken, invitationExpiresAt } from "@/lib/invitations";
import { isValidWhatsapp, normalizeWhatsapp } from "@/lib/whatsapp";

const invitationSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254),
  role: z.enum(["ADMIN", "STAFF"]),
  whatsappName: z.string().trim().max(100).optional(),
  whatsappNumber: z.string().trim().max(20).refine(isValidWhatsapp, "Informe um WhatsApp válido com DDD.").optional(),
});

export async function POST(request: Request) {
  const access = await getCurrentAccess();
  if (!access) return Response.json({ error: "Não autenticado." }, { status: 401 });
  if (!access.profile || isAccessBlocked(access.profile.status) || !hasAnyRole(access.roles, ["ADMIN"])) {
    return Response.json({ error: "Acesso restrito a administradores." }, { status: 403 });
  }

  const parsed = invitationSchema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Revise os dados do convite." }, { status: 400 });

  try {
    const db = getDb();
    const data = parsed.data;
    const email = data.email.toLowerCase();
    const [existingUser] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
    if (existingUser) {
      const roles = await db.select({ role: userRoles.role }).from(userRoles).where(eq(userRoles.userId, existingUser.id));
      if (roles.some(({ role }) => role === data.role)) {
        return Response.json({ error: "Esta pessoa já possui o papel selecionado." }, { status: 409 });
      }
    }

    await db.update(internalInvitations).set({ status: "REVOKED", updatedAt: new Date() }).where(and(
      eq(internalInvitations.email, email),
      eq(internalInvitations.status, "PENDING"),
    ));

    const token = createInvitationToken();
    const invitationId = randomUUID();
    const expiresAt = invitationExpiresAt();
    const whatsappNumber = data.whatsappNumber ? normalizeWhatsapp(data.whatsappNumber) : null;
    await db.insert(internalInvitations).values({
      id: invitationId,
      email,
      name: data.name,
      role: data.role,
      whatsappName: data.whatsappName || null,
      whatsappNumber,
      tokenHash: hashInvitationToken(token),
      invitedBy: access.session.user.id,
      expiresAt,
    });
    await db.insert(auditLogs).values({
      actorUserId: access.session.user.id,
      targetUserId: existingUser?.id ?? null,
      action: "INTERNAL_INVITATION_CREATED",
      details: { invitationId, email, role: data.role },
    });

    return Response.json({
      ok: true,
      invitationId,
      inviteUrl: `${appBaseURL}/convite/${token}`,
      expiresAt: expiresAt.toISOString(),
      whatsappNumber,
    });
  } catch (error) {
    console.error("[admin/invitations]", error);
    return Response.json({ error: "Não foi possível criar o convite." }, { status: 500 });
  }
}
