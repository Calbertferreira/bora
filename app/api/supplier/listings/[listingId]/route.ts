import { del } from "@vercel/blob";
import { and, eq, inArray } from "drizzle-orm";
import { auditLogs, supplierListingImages, supplierListings } from "@/lib/db/schema";
import { listingDetailsSchema, listingPatchSchema } from "@/lib/listing-validation";
import { requireActiveSupplierApi } from "@/lib/supplier-access";

async function ownedListing(listingId: string, userId: string, db: ReturnType<typeof import("@/lib/db").getDb>) {
  return (await db.select().from(supplierListings).where(and(
    eq(supplierListings.id, listingId),
    eq(supplierListings.supplierUserId, userId),
  )).limit(1))[0];
}

export async function PATCH(request: Request, context: { params: Promise<{ listingId: string }> }) {
  const supplierContext = await requireActiveSupplierApi();
  if ("response" in supplierContext) return supplierContext.response;
  const { listingId } = await context.params;
  const parsed = listingPatchSchema.safeParse(await request.json());
  if (!parsed.success) return Response.json({ error: "Revise os dados informados." }, { status: 400 });

  const userId = supplierContext.access.session.user.id;
  const current = await ownedListing(listingId, userId, supplierContext.db);
  if (!current) return Response.json({ error: "Item não encontrado." }, { status: 404 });
  const { newImages = [], removedImageIds = [], ...changes } = parsed.data;
  if (newImages.some((image) => !image.pathname.startsWith(`suppliers/${userId}/`))) {
    return Response.json({ error: "Uma das fotos não pertence a este fornecedor." }, { status: 400 });
  }
  const merged = listingDetailsSchema.safeParse({
    type: changes.type ?? current.type,
    name: changes.name ?? current.name,
    description: changes.description ?? current.description,
    priceCents: changes.priceCents ?? current.priceCents,
    priceUnit: changes.priceUnit ?? current.priceUnit,
    capacity: changes.capacity !== undefined ? changes.capacity : current.capacity,
    city: changes.city !== undefined ? changes.city : current.city,
    state: changes.state !== undefined ? changes.state : current.state,
    status: changes.status ?? current.status,
  });
  if (!merged.success) return Response.json({ error: "Preencha os dados obrigatórios deste tipo de item." }, { status: 400 });

  try {
    const existingImages = await supplierContext.db.select().from(supplierListingImages)
      .where(eq(supplierListingImages.listingId, listingId));
    const removable = existingImages.filter((image) => removedImageIds.includes(image.id));
    if (existingImages.length - removable.length + newImages.length < 1) {
      return Response.json({ error: "Mantenha pelo menos uma foto no item." }, { status: 400 });
    }
    if (existingImages.length - removable.length + newImages.length > 8) {
      return Response.json({ error: "Cada item pode ter no máximo oito fotos." }, { status: 400 });
    }

    await supplierContext.db.update(supplierListings).set({
      ...merged.data,
      city: merged.data.city || null,
      state: merged.data.state || null,
      capacity: merged.data.capacity || null,
      updatedAt: new Date(),
    }).where(and(eq(supplierListings.id, listingId), eq(supplierListings.supplierUserId, userId)));

    if (removable.length) {
      await del(removable.map((image) => image.url));
      await supplierContext.db.delete(supplierListingImages).where(inArray(supplierListingImages.id, removable.map((image) => image.id)));
    }
    if (newImages.length) {
      const startingOrder = existingImages.length - removable.length;
      await supplierContext.db.insert(supplierListingImages).values(newImages.map((image, index) => ({
        listingId,
        url: image.url,
        pathname: image.pathname,
        altText: image.altText || merged.data.name,
        sortOrder: startingOrder + index,
      })));
    }
    await supplierContext.db.insert(auditLogs).values({
      actorUserId: userId,
      targetUserId: userId,
      action: "SUPPLIER_LISTING_UPDATED",
      details: { listingId, status: merged.data.status },
    });
    return Response.json({ ok: true });
  } catch (error) {
    console.error("[supplier/listings/:id PATCH]", error);
    return Response.json({ error: "Não foi possível atualizar este item." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ listingId: string }> }) {
  const supplierContext = await requireActiveSupplierApi();
  if ("response" in supplierContext) return supplierContext.response;
  const { listingId } = await context.params;
  const userId = supplierContext.access.session.user.id;
  const current = await ownedListing(listingId, userId, supplierContext.db);
  if (!current) return Response.json({ error: "Item não encontrado." }, { status: 404 });

  try {
    const images = await supplierContext.db.select({ url: supplierListingImages.url }).from(supplierListingImages)
      .where(eq(supplierListingImages.listingId, listingId));
    if (images.length) await del(images.map(({ url }) => url));
    await supplierContext.db.delete(supplierListings).where(and(
      eq(supplierListings.id, listingId),
      eq(supplierListings.supplierUserId, userId),
    ));
    await supplierContext.db.insert(auditLogs).values({
      actorUserId: userId,
      targetUserId: userId,
      action: "SUPPLIER_LISTING_DELETED",
      details: { listingId, name: current.name },
    });
    return Response.json({ ok: true });
  } catch (error) {
    console.error("[supplier/listings/:id DELETE]", error);
    return Response.json({ error: "Não foi possível excluir este item." }, { status: 500 });
  }
}
