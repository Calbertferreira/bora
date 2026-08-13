import { auditLogs, supplierListingImages, supplierListings } from "@/lib/db/schema";
import { listingCreateSchema } from "@/lib/listing-validation";
import { requireActiveSupplierApi } from "@/lib/supplier-access";

export async function POST(request: Request) {
  const supplierContext = await requireActiveSupplierApi();
  if ("response" in supplierContext) return supplierContext.response;

  const parsed = listingCreateSchema.safeParse(await request.json());
  if (!parsed.success) {
    return Response.json({ error: "Revise os dados, o preço e as fotos do item." }, { status: 400 });
  }

  const { images, ...details } = parsed.data;
  const userId = supplierContext.access.session.user.id;
  if (images.some((image) => !image.pathname.startsWith(`suppliers/${userId}/`))) {
    return Response.json({ error: "Uma das fotos não pertence a este fornecedor." }, { status: 400 });
  }

  try {
    const [listing] = await supplierContext.db.insert(supplierListings).values({
      ...details,
      supplierUserId: userId,
      city: details.city || null,
      state: details.state || null,
      capacity: details.capacity || null,
    }).returning({ id: supplierListings.id });
    try {
      await supplierContext.db.insert(supplierListingImages).values(images.map((image, index) => ({
        listingId: listing.id,
        url: image.url,
        pathname: image.pathname,
        altText: image.altText || details.name,
        sortOrder: index,
      })));
    } catch (error) {
      await supplierContext.db.delete(supplierListings).where((await import("drizzle-orm")).eq(supplierListings.id, listing.id));
      throw error;
    }
    await supplierContext.db.insert(auditLogs).values({
      actorUserId: userId,
      targetUserId: userId,
      action: "SUPPLIER_LISTING_CREATED",
      details: { listingId: listing.id, type: details.type, status: details.status },
    });
    return Response.json({ ok: true, listingId: listing.id }, { status: 201 });
  } catch (error) {
    console.error("[supplier/listings]", error);
    return Response.json({ error: "Não foi possível salvar este item do catálogo." }, { status: 500 });
  }
}
