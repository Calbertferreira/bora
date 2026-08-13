import { and, eq, inArray, notInArray } from "drizzle-orm";
import { z } from "zod";
import { auditLogs, serviceCategories, supplierProfiles, supplierServices } from "@/lib/db/schema";
import { cleanServiceName, normalizeServiceName } from "@/lib/services";
import { requireActiveSupplierApi } from "@/lib/supplier-access";

const servicesSchema = z.object({
  serviceIds: z.array(z.string().uuid()).max(30).default([]),
  customServices: z.array(z.string().trim().min(2).max(80)).max(10).default([]),
}).refine((data) => data.serviceIds.length + data.customServices.length > 0, {
  message: "Escolha pelo menos um serviço.",
});

export async function PATCH(request: Request) {
  const supplierContext = await requireActiveSupplierApi();
  if ("response" in supplierContext) return supplierContext.response;

  const parsed = servicesSchema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Escolha pelo menos um serviço oferecido pela empresa." }, { status: 400 });

  const userId = supplierContext.access.session.user.id;
  const { db } = supplierContext;

  try {
    const uniqueSuggestedIds = [...new Set(parsed.data.serviceIds)];
    const suggested = uniqueSuggestedIds.length
      ? await db.select({ id: serviceCategories.id, name: serviceCategories.name })
        .from(serviceCategories)
        .where(and(inArray(serviceCategories.id, uniqueSuggestedIds), eq(serviceCategories.active, true)))
      : [];
    if (suggested.length !== uniqueSuggestedIds.length) {
      return Response.json({ error: "Um dos serviços sugeridos não está mais disponível." }, { status: 400 });
    }

    const customNames = [...new Map(parsed.data.customServices.map((value) => [normalizeServiceName(value), cleanServiceName(value)])).values()];
    const custom = [] as { id: string; name: string }[];
    for (const name of customNames) {
      const [service] = await db.insert(serviceCategories)
        .values({ name, normalizedName: normalizeServiceName(name), createdBy: userId })
        .onConflictDoUpdate({ target: serviceCategories.normalizedName, set: { active: true } })
        .returning({ id: serviceCategories.id, name: serviceCategories.name });
      custom.push(service);
    }

    const selected = [...suggested, ...custom]
      .filter((service, index, all) => all.findIndex(({ id }) => id === service.id) === index)
      .sort((left, right) => left.name.localeCompare(right.name, "pt-BR"));
    const selectedIds = selected.map(({ id }) => id);

    await db.insert(supplierServices)
      .values(selectedIds.map((serviceCategoryId) => ({ supplierUserId: userId, serviceCategoryId })))
      .onConflictDoNothing();
    await db.delete(supplierServices).where(and(
      eq(supplierServices.supplierUserId, userId),
      notInArray(supplierServices.serviceCategoryId, selectedIds),
    ));
    await db.update(supplierProfiles).set({
      serviceCategory: selected.map(({ name }) => name).join(", "),
      updatedAt: new Date(),
    }).where(eq(supplierProfiles.userId, userId));
    await db.insert(auditLogs).values({
      actorUserId: userId,
      targetUserId: userId,
      action: "SUPPLIER_SERVICES_UPDATED",
      details: { serviceIds: selectedIds, serviceNames: selected.map(({ name }) => name) },
    });

    return Response.json({ ok: true, services: selected });
  } catch (error) {
    console.error("[supplier/services]", error);
    return Response.json({ error: "Não foi possível atualizar os serviços da empresa." }, { status: 500 });
  }
}
