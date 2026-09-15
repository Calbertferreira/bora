import { and, asc, desc, eq, inArray, isNotNull, ne, or } from "drizzle-orm";
import { CalendarDays, MapPin, Pencil, Plus, Users } from "lucide-react";
import { ContractTemplateUpload } from "@/components/supplier/contract-template-upload";
import { PackageBuilder } from "@/components/supplier/package-builder";
import { requirePageRole } from "@/lib/access";
import { getDb } from "@/lib/db";
import { clientContacts, eventLocations, eventPackageItems, eventPackages, supplierListings, supplierProfiles } from "@/lib/db/schema";

const statusLabels = { DRAFT: "Rascunho", SENT: "Enviado", ACCEPTED: "Aceito", CANCELLED: "Cancelado" } as const;
const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export default async function SupplierPackagesPage({ searchParams }: { searchParams: Promise<{ novo?: string; editar?: string }> }) {
  const access = await requirePageRole(["SUPPLIER"]);
  const db = getDb();
  const query = await searchParams;
  const [supplier] = await db.select().from(supplierProfiles).where(eq(supplierProfiles.userId, access.session.user.id)).limit(1);
  if (!supplier || supplier.approvalStatus !== "ACTIVE") return <main className="supplier-page"><section className="supplier-shell"><div className="catalog-empty"><h1>Aguardando aprovação</h1><p>Os eventos serão liberados após a aprovação do fornecedor.</p></div></section></main>;

  const [otherSuppliers, packages, publishedLocations] = await Promise.all([
    db.select({ id: supplierProfiles.userId, name: supplierProfiles.businessName }).from(supplierProfiles).where(and(eq(supplierProfiles.approvalStatus, "ACTIVE"), ne(supplierProfiles.userId, access.session.user.id))).orderBy(asc(supplierProfiles.businessName)),
    db.select().from(eventPackages).where(eq(eventPackages.organizerSupplierId, access.session.user.id)).orderBy(desc(eventPackages.updatedAt)),
    db.select({ id: supplierListings.eventLocationId }).from(supplierListings).where(and(eq(supplierListings.type, "VENUE"), eq(supplierListings.status, "PUBLISHED"), isNotNull(supplierListings.eventLocationId))),
  ]);
  const visibleLocationIds = [...new Set([...packages.map((item) => item.eventLocationId), ...publishedLocations.map((item) => item.id)].filter(Boolean))] as string[];
  const locations = await db.select().from(eventLocations).where(visibleLocationIds.length ? or(eq(eventLocations.createdBySupplierId, access.session.user.id), inArray(eventLocations.id, visibleLocationIds)) : eq(eventLocations.createdBySupplierId, access.session.user.id)).orderBy(asc(eventLocations.name));
  const priorContactIds = packages.map((item) => item.clientContactId).filter(Boolean) as string[];
  const contacts = await db.select({ id: clientContacts.id, name: clientContacts.name, email: clientContacts.email, whatsapp: clientContacts.whatsappNumber }).from(clientContacts).where(priorContactIds.length ? or(eq(clientContacts.createdBySupplierId, access.session.user.id), inArray(clientContacts.id, priorContactIds)) : eq(clientContacts.createdBySupplierId, access.session.user.id)).orderBy(asc(clientContacts.name));

  const editPackage = query.editar ? packages.find((item) => item.id === query.editar) : undefined;
  const editItems = editPackage ? await db.select().from(eventPackageItems).where(eq(eventPackageItems.packageId, editPackage.id)).orderBy(asc(eventPackageItems.sortOrder)) : [];
  const editLocation = editPackage?.eventLocationId ? locations.find((location) => location.id === editPackage.eventLocationId) : undefined;
  const showForm = query.novo === "1" || Boolean(editPackage);
  const initial = editPackage ? {
    id: editPackage.id,
    clientContactId: editPackage.clientContactId ?? "",
    clientName: editPackage.clientName,
    clientEmail: editPackage.clientEmail,
    clientWhatsapp: editPackage.clientWhatsapp ?? "",
    eventLocationId: editPackage.eventLocationId ?? "",
    locationName: editLocation?.name ?? (editPackage.eventLocation ? "Local do evento" : ""),
    locationAddress: editLocation?.address ?? editPackage.eventLocation ?? "",
    locationCity: editLocation?.city ?? "",
    locationState: editLocation?.state ?? "",
    eventType: editPackage.eventType,
    eventTitle: editPackage.eventTitle,
    eventDate: editPackage.eventDate ?? "",
    items: editItems.map((item) => ({ serviceName: item.serviceName, description: item.description ?? "", providerKind: item.providerKind, providerSupplierId: item.providerSupplierId ?? "", providerName: item.providerKind === "MANUAL" ? item.providerName : "", amount: (item.amountCents / 100).toFixed(2).replace(".", ",") })),
  } : undefined;

  return <main className="supplier-page">
    <header className="dashboard-nav"><a className="brand" href="/">bora<span>.</span></a><nav className="supplier-nav"><a href="/fornecedor/catalogo">Catálogo</a><a href="/painel">Meu painel</a></nav></header>
    <section className="supplier-shell">
      <div className="supplier-heading"><div><span>ORGANIZAÇÃO DE EVENTOS</span><h1>Eventos e pacotes</h1><p>Acompanhe os eventos cadastrados e abra cada um para montar serviços, valores e contrato.</p></div><b>Taxa administrativa: {(supplier.administrationFeeBps / 100).toLocaleString("pt-BR")}%</b></div>

      <section className="event-register-card">
        <div className="event-list-heading"><div><span>EVENTOS CADASTRADOS</span><h2>Meus eventos</h2></div><a className="new-event-button" href="/fornecedor/pacotes?novo=1"><Plus size={17} /> Cadastrar novo evento</a></div>
        {packages.length ? <div className="event-table-wrap"><table className="event-table"><thead><tr><th>Evento</th><th>Cliente</th><th>Data e local</th><th>Origem</th><th>Status</th><th>Total</th><th>Ação</th></tr></thead><tbody>{packages.map((item) => <tr key={item.id}>
          <td><strong>{item.eventTitle}</strong><small>{item.eventType}</small></td>
          <td><span><Users size={14} /> {item.clientName}</span><small>{item.clientWhatsapp || item.clientEmail}</small></td>
          <td><span><CalendarDays size={14} /> {item.eventDate ? new Date(`${item.eventDate}T00:00:00Z`).toLocaleDateString("pt-BR", { timeZone: "UTC" }) : "A definir"}</span><small><MapPin size={12} /> {item.eventLocation || "Local a definir"}</small></td>
          <td><span className="origin-badge origin-supplier">Fornecedor</span></td>
          <td><span className={`event-status event-status-${item.status.toLowerCase()}`}>{statusLabels[item.status]}</span></td>
          <td><strong>{money.format(item.totalCents / 100)}</strong></td>
          <td><a className="edit-event-button" href={`/fornecedor/pacotes?editar=${item.id}`}><Pencil size={14} /> Editar</a></td>
        </tr>)}</tbody></table></div> : <div className="event-list-empty"><CalendarDays /><h3>Nenhum evento cadastrado</h3><p>Cadastre o primeiro evento para selecionar o cliente, o local e montar o pacote.</p><a href="/fornecedor/pacotes?novo=1">Cadastrar novo evento</a></div>}
      </section>

      {showForm && <PackageBuilder suppliers={otherSuppliers} contacts={contacts} locations={locations.map((location) => ({ id: location.id, name: location.name, address: location.address, city: location.city ?? "", state: location.state ?? "" }))} administrationFeePercent={supplier.administrationFeeBps / 100} initial={initial} />}
      <ContractTemplateUpload userId={access.session.user.id} currentName={supplier.contractTemplateName} />
    </section>
  </main>;
}
