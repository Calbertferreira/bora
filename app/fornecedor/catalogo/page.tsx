import { asc, desc, eq, inArray } from "drizzle-orm";
import { CatalogManager } from "@/components/supplier/catalog-manager";
import { SupplierServicesManager } from "@/components/supplier/supplier-services-manager";
import { requirePageRole } from "@/lib/access";
import { getDb } from "@/lib/db";
import { serviceCategories, supplierListingImages, supplierListings, supplierProfiles, supplierServices } from "@/lib/db/schema";

export default async function SupplierCatalogPage() {
  const access = await requirePageRole(["SUPPLIER"]);
  const db = getDb();
  const [supplier] = await db.select().from(supplierProfiles)
    .where(eq(supplierProfiles.userId, access.session.user.id)).limit(1);

  if (!supplier || supplier.approvalStatus !== "ACTIVE") {
    return <main className="supplier-page">
      <header className="dashboard-nav"><a className="brand" href="/">bora<span>.</span></a><a className="supplier-back" href="/painel">Voltar ao painel</a></header>
      <section className="supplier-shell narrow">
        <div className="catalog-empty"><span>CATÁLOGO</span><h1>Aguardando liberação</h1><p>O catálogo será habilitado assim que o cadastro do fornecedor for aprovado pela equipe BORA.</p><a className="primary-link-button" href="/painel">Acompanhar cadastro</a></div>
      </section>
    </main>;
  }

  const listings = await db.select().from(supplierListings)
    .where(eq(supplierListings.supplierUserId, access.session.user.id))
    .orderBy(desc(supplierListings.createdAt));
  const images = listings.length
    ? await db.select().from(supplierListingImages)
      .where(inArray(supplierListingImages.listingId, listings.map(({ id }) => id)))
    : [];
  const serviceSuggestions = await db.select({ id: serviceCategories.id, name: serviceCategories.name })
    .from(serviceCategories)
    .where(eq(serviceCategories.active, true))
    .orderBy(asc(serviceCategories.name));
  const selectedServices = await db.select({ id: serviceCategories.id, name: serviceCategories.name })
    .from(supplierServices)
    .innerJoin(serviceCategories, eq(serviceCategories.id, supplierServices.serviceCategoryId))
    .where(eq(supplierServices.supplierUserId, access.session.user.id))
    .orderBy(asc(serviceCategories.name));

  return <main className="supplier-page">
    <header className="dashboard-nav"><a className="brand" href="/">bora<span>.</span></a><div><a className="supplier-back" href="/painel">Meu painel</a><span>{access.session.user.email}</span></div></header>
    <section className="supplier-shell">
      <div className="supplier-heading"><div><span>ÁREA DO FORNECEDOR</span><h1>Catálogo de espaços e serviços</h1><p>Cadastre suas opções com fotos e preços para aparecerem nos planejamentos do BORA.</p></div><b>{supplier.businessName}</b></div>
      <SupplierServicesManager initialSuggestions={serviceSuggestions} initialSelected={selectedServices} />
      <CatalogManager
        userId={access.session.user.id}
        initialListings={listings.map((listing) => ({
          id: listing.id,
          type: listing.type,
          name: listing.name,
          description: listing.description,
          priceCents: listing.priceCents,
          priceUnit: listing.priceUnit,
          capacity: listing.capacity,
          city: listing.city,
          state: listing.state,
          status: listing.status,
          images: images.filter((image) => image.listingId === listing.id).sort((a, b) => a.sortOrder - b.sortOrder).map((image) => ({
            id: image.id,
            url: `/api/supplier/images/${image.id}`,
            pathname: image.pathname,
            altText: image.altText,
          })),
        }))}
      />
    </section>
  </main>;
}
