import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getCurrentAccess, isAccessBlocked } from "@/lib/access";
import { getDb } from "@/lib/db";
import { auditLogs, internalInvitations, userProfiles, userRoles } from "@/lib/db/schema";
import { hashInvitationToken } from "@/lib/invitations";
import { isValidWhatsapp, normalizeWhatsapp } from "@/lib/whatsapp";

const acceptSchema = z.object({
  token: z.string().min(40).max(200),
  whatsappName: z.string().trim().min(2).max(100).optional(),
  whatsappNumber: z.string().trim().min(10).max(20).refine(isValidWhatsapp, "Informe um WhatsApp válido com DDD.").optional(),
  acceptedTerms: z.boolean().optional(),
});

export async function POST(request: Request) {
  const access = await getCurrentAccess();
  if (!access) return Response.json({ error: "Entre na conta convidada para continuar." }, { status: 401 });
  const parsed = acceptSchema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Convite ou dados inválidos." }, { status: 400 });

  try {
    const db = getDb();
    const [invitation] = await db.select().from(internalInvitations).where(and(
      eq(internalInvitations.tokenHash, hashInvitationToken(parsed.data.token)),
      eq(internalInvitations.status, "PENDING"),
    )).limit(1);
    if (!invitation) return Response.json({ error: "Convite inválido ou já utilizado." }, { status: 404 });
    if (invitation.expiresAt.getTime() <= Date.now()) {
      await db.update(internalInvitations).set({ status: "EXPIRED", updatedAt: new Date() }).where(eq(internalInvitations.id, invitation.id));
      return Response.json({ error: "Este convite expirou." }, { status: 410 });
    }
    if (access.session.user.email.toLowerCase() !== invitation.email.toLowerCase()) {
      return Response.json({ error: "Este convite pertence a outro e-mail." }, { status: 403 });
    }
    if (access.profile && isAccessBlocked(access.profile.status)) {
      return Response.json({ error: "Esta conta está bloqueada. Procure um administrador." }, { status: 403 });
    }

    const whatsappName = parsed.data.whatsappName || invitation.whatsappName || access.profile?.whatsappName;
    const whatsappSource = parsed.data.whatsappNumber || invitation.whatsappNumber || access.profile?.whatsappNumber;
    if (!whatsappName || !whatsappSource) return Response.json({ error: "Informe os dados do WhatsApp." }, { status: 400 });
    if (!access.profile && parsed.data.acceptedTerms !== true) return Response.json({ error: "É necessário aceitar os termos de uso." }, { status: 400 });
    const whatsappNumber = normalizeWhatsapp(whatsappSource);

    await db.insert(userProfiles).values({
      userId: access.session.user.id,
      whatsappName,
      whatsappNumber,
      status: "ACTIVE",
      acceptsOperationalMessages: true,
      acceptsMarketing: false,
      acceptedTermsAt: new Date(),
    }).onConflictDoUpdate({
      target: userProfiles.userId,
      set: { whatsappName, whatsappNumber, updatedAt: new Date() },
    });
    await db.insert(userRoles).values({ userId: access.session.user.id, role: invitation.role }).onConflictDoNothing();
    await db.update(internalInvitations).set({
      status: "ACCEPTED",
      acceptedBy: access.session.user.id,
      acceptedAt: new Date(),
      updatedAt: new Date(),
    }).where(eq(internalInvitations.id, invitation.id));
    await db.insert(auditLogs).values({
      actorUserId: access.session.user.id,
      targetUserId: access.session.user.id,
      action: "INTERNAL_INVITATION_ACCEPTED",
      details: { invitationId: invitation.id, role: invitation.role },
    });
    return Response.json({ ok: true, role: invitation.role });
  } catch (error) {
    console.error("[invitations/accept]", error);
    return Response.json({ error: "Não foi possível aceitar o convite." }, { status: 500 });
  }
}
