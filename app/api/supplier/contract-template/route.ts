import { eq } from "drizzle-orm";
import { z } from "zod";
import { requireActiveSupplierApi } from "@/lib/supplier-access";
import { auditLogs, supplierProfiles } from "@/lib/db/schema";

const schema = z.object({ url: z.url(), pathname: z.string().min(5).max(500), name: z.string().min(1).max(200) });

export async function PATCH(request: Request) {
  const context = await requireActiveSupplierApi(); if ("response" in context) return context.response;
  const parsed = schema.safeParse(await request.json()); if (!parsed.success) return Response.json({ error: "Arquivo PDF inválido." }, { status: 400 });
  const userId = context.access.session.user.id;
  if (!parsed.data.pathname.startsWith(`suppliers/${userId}/contracts/`)) return Response.json({ error: "O arquivo não pertence a este fornecedor." }, { status: 400 });
  await context.db.update(supplierProfiles).set({ contractTemplateUrl: parsed.data.url, contractTemplatePathname: parsed.data.pathname, contractTemplateName: parsed.data.name, contractTemplateUploadedAt: new Date(), updatedAt: new Date() }).where(eq(supplierProfiles.userId, userId));
  await context.db.insert(auditLogs).values({ actorUserId: userId, targetUserId: userId, action: "SUPPLIER_CONTRACT_TEMPLATE_UPDATED", details: { name: parsed.data.name } });
  return Response.json({ ok: true });
}
