import { eq } from "drizzle-orm";
import { getCurrentAccess, hasAnyRole, isAccessBlocked } from "@/lib/access";
import { getDb } from "@/lib/db";
import { supplierProfiles } from "@/lib/db/schema";

export async function requireActiveSupplierApi() {
  const access = await getCurrentAccess();
  if (!access) return { response: Response.json({ error: "Não autenticado." }, { status: 401 }) } as const;
  if (!access.profile || isAccessBlocked(access.profile.status) || !hasAnyRole(access.roles, ["SUPPLIER"])) {
    return { response: Response.json({ error: "Acesso restrito a fornecedores." }, { status: 403 }) } as const;
  }

  const db = getDb();
  const [supplier] = await db.select().from(supplierProfiles)
    .where(eq(supplierProfiles.userId, access.session.user.id)).limit(1);
  if (!supplier || supplier.approvalStatus !== "ACTIVE") {
    return { response: Response.json({ error: "O fornecedor precisa estar aprovado para publicar o catálogo." }, { status: 403 }) } as const;
  }
  return { access, supplier, db } as const;
}
