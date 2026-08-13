import { and, eq, inArray } from "drizzle-orm";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { serviceCategories, supplierProfiles, supplierServices, userProfiles, userRoles } from "@/lib/db/schema";
import { cleanServiceName, normalizeServiceName } from "@/lib/services";
import { isValidWhatsapp, normalizeWhatsapp } from "@/lib/whatsapp";

const onboardingSchema = z.object({
  role: z.enum(["CLIENT", "SUPPLIER"]),
  whatsappNumber: z.string().trim().min(10).max(20).refine(isValidWhatsapp, "Informe um WhatsApp válido com DDD."),
  whatsappName: z.string().trim().min(2).max(100),
  acceptsOperationalMessages: z.boolean().default(true),
  acceptsMarketing: z.boolean().default(false),
  acceptedTerms: z.literal(true),
  businessName: z.string().trim().max(160).optional(),
  serviceCategory: z.string().trim().min(2).max(120).optional(),
  serviceIds: z.array(z.string().uuid()).max(30).default([]),
  customServices: z.array(z.string().trim().min(2).max(80)).max(10).default([]),
});

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Não autenticado." }, { status: 401 });
  const parsed = onboardingSchema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Revise os dados informados." }, { status: 400 });

  const data = parsed.data;
  if (data.role === "SUPPLIER" && (!data.businessName || data.serviceIds.length + data.customServices.length === 0 && !data.serviceCategory)) {
    return Response.json({ error: "Informe o nome comercial e escolha pelo menos um serviço." }, { status: 400 });
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
    }).onConflictDoUpdate({ target: userProfiles.userId, set: { whatsappNumber, whatsappName: data.whatsappName, acceptsOperationalMessages: data.acceptsOperationalMessages, acceptsMarketing: data.acceptsMarketing, updatedAt: new Date() } });
    await db.insert(userRoles).values({ userId: session.user.id, role: data.role }).onConflictDoNothing();

    if (data.role === "SUPPLIER") {
      const uniqueSuggestedIds = [...new Set(data.serviceIds)];
      const selectedSuggested = uniqueSuggestedIds.length ? await db.select({ id: serviceCategories.id, name: serviceCategories.name }).from(serviceCategories).where(and(inArray(serviceCategories.id, uniqueSuggestedIds), eq(serviceCategories.active, true))) : [];
      if (selectedSuggested.length !== uniqueSuggestedIds.length) return Response.json({ error: "Um dos serviços sugeridos não está disponível." }, { status: 400 });

      const selectedCustom = [] as { id: string; name: string }[];
      const customServices = data.serviceCategory ? [...data.customServices, data.serviceCategory] : data.customServices;
      const uniqueCustom = [...new Map(customServices.map((value) => [normalizeServiceName(value), cleanServiceName(value)])).values()];
      for (const name of uniqueCustom) {
        const [service] = await db.insert(serviceCategories).values({ name, normalizedName: normalizeServiceName(name), createdBy: session.user.id }).onConflictDoUpdate({ target: serviceCategories.normalizedName, set: { active: true } }).returning({ id: serviceCategories.id, name: serviceCategories.name });
        selectedCustom.push(service);
      }
      const selected = [...selectedSuggested, ...selectedCustom].filter((service, index, all) => all.findIndex(({ id }) => id === service.id) === index);
      const serviceCategory = selected.map(({ name }) => name).join(", ");
      await db.insert(supplierProfiles).values({ userId: session.user.id, businessName: data.businessName!, serviceCategory, approvalStatus: "UNDER_REVIEW" }).onConflictDoUpdate({ target: supplierProfiles.userId, set: { businessName: data.businessName!, serviceCategory, updatedAt: new Date() } });
      await db.delete(supplierServices).where(eq(supplierServices.supplierUserId, session.user.id));
      if (selected.length) await db.insert(supplierServices).values(selected.map(({ id }) => ({ supplierUserId: session.user.id, serviceCategoryId: id })));
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
