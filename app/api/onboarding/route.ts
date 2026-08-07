import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { supplierProfiles, userProfiles, userRoles } from "@/lib/db/schema";
import { isValidWhatsapp, normalizeWhatsapp } from "@/lib/whatsapp";

const onboardingSchema = z.object({
  role: z.enum(["CLIENT", "SUPPLIER"]),
  whatsappNumber: z.string().trim().min(10).max(20).refine(isValidWhatsapp, "Informe um WhatsApp válido com DDD."),
  whatsappName: z.string().trim().min(2).max(100),
  acceptsOperationalMessages: z.boolean().default(true),
  acceptsMarketing: z.boolean().default(false),
  acceptedTerms: z.literal(true),
  businessName: z.string().trim().max(160).optional(),
  serviceCategory: z.string().trim().max(120).optional(),
});

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Não autenticado." }, { status: 401 });

  const parsed = onboardingSchema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Revise os dados informados." }, { status: 400 });

  const data = parsed.data;
  if (data.role === "SUPPLIER" && (!data.businessName || !data.serviceCategory)) {
    return Response.json({ error: "Informe o nome comercial e a categoria do serviço." }, { status: 400 });
  }

  try {
    const db = getDb();
    const [existingProfile] = await db.select({ status: userProfiles.status }).from(userProfiles).where(eq(userProfiles.userId, session.user.id)).limit(1);
    if (existingProfile && ["SUSPENDED", "BLOCKED", "REJECTED", "INACTIVE"].includes(existingProfile.status)) {
      return Response.json({ error: "Esta conta não pode alterar o cadastro." }, { status: 403 });
    }
    const whatsappNumber = normalizeWhatsapp(data.whatsappNumber);
    const status = "ACTIVE";

    await db.insert(userProfiles).values({
      userId: session.user.id,
      whatsappNumber,
      whatsappName: data.whatsappName,
      status,
      acceptsOperationalMessages: data.acceptsOperationalMessages,
      acceptsMarketing: data.acceptsMarketing,
      acceptedTermsAt: new Date(),
    }).onConflictDoUpdate({
      target: userProfiles.userId,
      set: {
        whatsappNumber,
        whatsappName: data.whatsappName,
        acceptsOperationalMessages: data.acceptsOperationalMessages,
        acceptsMarketing: data.acceptsMarketing,
        updatedAt: new Date(),
      },
    });

    await db.insert(userRoles).values({ userId: session.user.id, role: data.role }).onConflictDoNothing();

    if (data.role === "SUPPLIER") {
      await db.insert(supplierProfiles).values({
        userId: session.user.id,
        businessName: data.businessName!,
        serviceCategory: data.serviceCategory!,
        approvalStatus: "UNDER_REVIEW",
      }).onConflictDoUpdate({
        target: supplierProfiles.userId,
        set: {
          businessName: data.businessName!,
          serviceCategory: data.serviceCategory!,
          updatedAt: new Date(),
        },
      });
    }

    return Response.json({ ok: true, status });
  } catch (error) {
    console.error("[onboarding]", error);
    return Response.json({ error: "Não foi possível concluir o cadastro." }, { status: 500 });
  }
}

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Não autenticado." }, { status: 401 });
  const db = getDb();
  const [profile] = await db.select().from(userProfiles).where(eq(userProfiles.userId, session.user.id)).limit(1);
  const roles = await db.select({ role: userRoles.role }).from(userRoles).where(eq(userRoles.userId, session.user.id));
  return Response.json({ profile: profile ?? null, roles: roles.map((item) => item.role) });
}
