import { eq } from "drizzle-orm";
import { eventLocations } from "@/lib/db/schema";
import type { getDb } from "@/lib/db";

export function normalizeEventAddress(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function formatEventLocation(location: { name: string; address: string; city: string | null; state: string | null }) {
  const cityState = [location.city, location.state].filter(Boolean).join("/");
  return `${location.name} — ${location.address}${cityState ? ` · ${cityState}` : ""}`;
}

export async function resolveEventLocation(db: ReturnType<typeof getDb>, data: { eventLocationId?: string; locationName?: string; locationAddress?: string; locationCity?: string; locationState?: string }, supplierUserId: string) {
  if (data.eventLocationId) {
    const [existing] = await db.select().from(eventLocations).where(eq(eventLocations.id, data.eventLocationId)).limit(1);
    if (!existing) throw new Error("LOCATION_NOT_FOUND");
    return existing;
  }
  const name = data.locationName?.trim();
  const address = data.locationAddress?.trim();
  if (!name || name.length < 2 || !address || address.length < 5) throw new Error("LOCATION_REQUIRED");
  const city = data.locationCity?.trim() || "";
  const state = data.locationState?.trim().toUpperCase() || "";
  const normalizedAddress = normalizeEventAddress([address, city, state].filter(Boolean).join(" "));
  if (normalizedAddress.length < 5) throw new Error("LOCATION_REQUIRED");
  const [location] = await db.insert(eventLocations).values({
    name,
    address,
    normalizedAddress,
    city: city || null,
    state: state || null,
    createdBySupplierId: supplierUserId,
  }).onConflictDoUpdate({ target: eventLocations.normalizedAddress, set: { updatedAt: new Date() } }).returning();
  return location;
}
