import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { requireActiveSupplierApi } from "@/lib/supplier-access";
import { auditLogs, clientContacts, eventPackageItems, eventPackages, supplierListings, supplierProfiles } from "@/lib/db/schema";
import { isValidWhatsapp, normalizeWhatsapp } from "@/lib/whatsapp";

const itemSchema = z.object({ serviceName: z.string().trim().min(2).max(120), description: z.string().trim().max(500).optional().default(""), providerKind: z.enum(["SELF", "REGISTERED", "MANUAL"]), providerSupplierId: z.uuid().optional().or(z.literal("")), providerName: z.string().trim().max(160).optional().default(""), amountCents: z.coerce.number().int().min(1).max(1000000000) });
const schema = z.object({ clientContactId: z.uuid().optional().or(z.literal("")), clientName: z.string().trim().min(2).max(160), clientEmail: z.email(), clientWhatsapp: z.string().trim().min(10).max(30).refine(isValidWhatsapp, "Informe um WhatsApp válido."), venueListingId: z.uuid().optional().or(z.literal("")), eventType: z.string().trim().min(2).max(100), eventTitle: z.string().trim().min(3).max(160), eventDate: z.iso.date().optional().or(z.literal("")), eventLocation: z.string().trim().max(240).optional().default(""), sendToClient: z.boolean().default(false), items: z.array(itemSchema).min(1).max(50) });

export async function POST(request: Request) {
  const context = await requireActiveSupplierApi(); if ("response" in context) return context.response;
  const parsed = schema.safeParse(await request.json()); if (!parsed.success) return Response.json({ error: "Revise o cliente, o evento e os itens da grade." }, { status: 400 });
  const data = parsed.data; const ownerId = context.access.session.user.id;
  const registeredIds = [...new Set(data.items.filter((item) => item.providerKind === "REGISTERED").map((item) => item.providerSupplierId).filter(Boolean))] as string[];
  const registered = registeredIds.length ? await context.db.select({ id: supplierProfiles.userId, name: supplierProfiles.businessName }).from(supplierProfiles).where(and(inArray(supplierProfiles.userId, registeredIds), eq(supplierProfiles.approvalStatus, "ACTIVE"))) : [];
  if (registered.length !== registeredIds.length) return Response.json({ error: "Um fornecedor vinculado não está disponível." }, { status: 400 });
  const registeredMap = new Map(registered.map((item) => [item.id, item.name]));
  const normalizedItems = data.items.map((item, index) => ({ ...item, providerSupplierId: item.providerKind === "SELF" ? ownerId : item.providerKind === "REGISTERED" ? item.providerSupplierId! : null, providerName: item.providerKind === "SELF" ? context.supplier.businessName : item.providerKind === "REGISTERED" ? registeredMap.get(item.providerSupplierId!)! : item.providerName || "Fornecedor informado", sortOrder: index }));
  let contact = data.clientContactId ? (await context.db.select().from(clientContacts).where(and(eq(clientContacts.id, data.clientContactId), eq(clientContacts.createdBySupplierId, ownerId))).limit(1))[0] : undefined;
  if (!contact) {
    const whatsappNumber = normalizeWhatsapp(data.clientWhatsapp);
    [contact] = await context.db.select().from(clientContacts).where(eq(clientContacts.whatsappNumber, whatsappNumber)).limit(1);
    if (!contact) [contact] = await context.db.insert(clientContacts).values({ whatsappNumber, name: data.clientName, email: data.clientEmail.toLowerCase(), createdBySupplierId: ownerId }).returning();
  }
  const client = contact.userId ? { id: contact.userId } : undefined;
  if (data.venueListingId) {
    const [venue] = await context.db.select({ id: supplierListings.id }).from(supplierListings).where(and(eq(supplierListings.id, data.venueListingId), eq(supplierListings.type, "VENUE"))).limit(1);
    if (!venue) return Response.json({ error: "Local cadastrado não encontrado." }, { status: 400 });
  }
  const subtotalCents = normalizedItems.reduce((sum, item) => sum + item.amountCents, 0); const feeCents = Math.round(subtotalCents * context.supplier.administrationFeeBps / 10000); const status = data.sendToClient ? "SENT" : "DRAFT";
  const [created] = await context.db.insert(eventPackages).values({ organizerSupplierId: ownerId, clientUserId: client?.id ?? null, clientContactId: contact.id, clientName: contact.name, clientEmail: contact.email, clientWhatsapp: contact.whatsappNumber, eventType: data.eventType, eventTitle: data.eventTitle, eventDate: data.eventDate || null, eventLocation: data.eventLocation || null, venueListingId: data.venueListingId || null, origin: "SUPPLIER", status, subtotalCents, administrationFeeBps: context.supplier.administrationFeeBps, administrationFeeCents: feeCents, totalCents: subtotalCents + feeCents, sentAt: data.sendToClient ? new Date() : null }).returning({ id: eventPackages.id });
  await context.db.insert(eventPackageItems).values(normalizedItems.map((item) => ({ packageId: created.id, serviceName: item.serviceName, description: item.description || null, providerKind: item.providerKind, providerSupplierId: item.providerSupplierId, providerName: item.providerName, amountCents: item.amountCents, sortOrder: item.sortOrder })));
  await context.db.insert(auditLogs).values({ actorUserId: ownerId, targetUserId: client?.id ?? null, action: data.sendToClient ? "SUPPLIER_PACKAGE_SENT" : "SUPPLIER_PACKAGE_CREATED", details: { packageId: created.id, totalCents: subtotalCents + feeCents, clientLinked: Boolean(client) } });
  return Response.json({ ok: true, packageId: created.id, clientLinked: Boolean(client), status }, { status: 201 });
}
