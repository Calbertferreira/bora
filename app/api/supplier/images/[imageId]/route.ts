import { get } from "@vercel/blob";
import { eq } from "drizzle-orm";
import { getCurrentAccess, hasAnyRole, isAccessBlocked } from "@/lib/access";
import { getDb } from "@/lib/db";
import { supplierListingImages, supplierListings } from "@/lib/db/schema";

export async function GET(request: Request, context: { params: Promise<{ imageId: string }> }) {
  const { imageId } = await context.params;
  const db = getDb();
  const [image] = await db.select({
    pathname: supplierListingImages.pathname,
    status: supplierListings.status,
    supplierUserId: supplierListings.supplierUserId,
  }).from(supplierListingImages).innerJoin(
    supplierListings,
    eq(supplierListingImages.listingId, supplierListings.id),
  ).where(eq(supplierListingImages.id, imageId)).limit(1);
  if (!image) return new Response("Foto não encontrada.", { status: 404 });

  if (image.status !== "PUBLISHED") {
    const access = await getCurrentAccess();
    const allowed = access?.profile && !isAccessBlocked(access.profile.status) && (
      access.session.user.id === image.supplierUserId || hasAnyRole(access.roles, ["ADMIN", "STAFF"])
    );
    if (!allowed) return new Response("Acesso não autorizado.", { status: 403 });
  }

  const result = await get(image.pathname, {
    access: "private",
    ifNoneMatch: request.headers.get("if-none-match") ?? undefined,
  });
  if (!result) return new Response("Foto não encontrada.", { status: 404 });
  if (result.statusCode === 304) {
    return new Response(null, { status: 304, headers: { ETag: result.blob.etag, "Cache-Control": "private, no-cache" } });
  }
  return new Response(result.stream, {
    headers: {
      "Content-Type": result.blob.contentType,
      "X-Content-Type-Options": "nosniff",
      ETag: result.blob.etag,
      "Cache-Control": "private, no-cache",
    },
  });
}
