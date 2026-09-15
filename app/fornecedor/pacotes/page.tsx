import { and, desc, eq, ne } from "drizzle-orm";
import { ContractTemplateUpload } from "@/components/supplier/contract-template-upload";
import { PackageBuilder } from "@/components/supplier/package-builder";
import { requirePageRole } from "@/lib/access";
import { getDb } from "@/lib/db";
import { eventPackages, supplierProfiles } from "@/lib/db/schema";

export default async function SupplierPackagesPage() {
  const access = await requirePageRole(["SUPPLIER"]); const db = getDb();
  const [supplier] = await db.select().from(supplierProfiles).where(eq(supplierProfiles.userId, access.session.user.id)).limit(1);
  if (!supplier || supplier.approvalStatus !== "ACTIVE") return <main className="supplier-page"><section className="supplier-shell"><div className="catalog-empty"><h1>Aguardando aprovação</h1><p>Os pacotes serão liberados após a aprovação do fornecedor.</p></div></section></main>;
  const [otherSuppliers, packages] = await Promise.all([
    db.select({ id: supplierProfiles.userId, name: supplierProfiles.businessName }).from(supplierProfiles).where(and(eq(supplierProfiles.approvalStatus, "ACTIVE"), ne(supplierProfiles.userId, access.session.user.id))),
    db.select().from(eventPackages).where(eq(eventPackages.organizerSupplierId, access.session.user.id)).orderBy(desc(eventPackages.createdAt)),
  ]);
  const status = { DRAFT: "Rascunho", SENT: "Enviado", ACCEPTED: "Aceito", CANCELLED: "Cancelado" } as const;
  return <main className="supplier-page"><header className="dashboard-nav"><a className="brand" href="/">bora<span>.</span></a><nav className="supplier-nav"><a href="/fornecedor/catalogo">Catálogo</a><a href="/painel">Meu painel</a></nav></header><section className="supplier-shell"><div className="supplier-heading"><div><span>ORGANIZAÇÃO DE EVENTOS</span><h1>Pacotes e contratos</h1><p>Monte a grade completa do evento, informe quem receberá cada valor e envie ao cliente.</p></div><b>Taxa administrativa: {(supplier.administrationFeeBps / 100).toLocaleString("pt-BR")}%</b></div><ContractTemplateUpload userId={access.session.user.id} currentName={supplier.contractTemplateName} /><PackageBuilder suppliers={otherSuppliers} administrationFeePercent={supplier.administrationFeeBps / 100} /><section className="supplier-packages"><h2>Pacotes cadastrados</h2>{packages.length ? packages.map((item) => <article key={item.id}><div><span>{status[item.status]}</span><strong>{item.eventTitle}</strong><small>{item.clientName} · {item.clientEmail}</small></div><b>{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(item.totalCents / 100)}</b></article>) : <p>Nenhum pacote cadastrado.</p>}</section></section></main>;
}
