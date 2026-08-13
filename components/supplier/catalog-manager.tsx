"use client";

import { upload } from "@vercel/blob/client";
import { Camera, Check, ImagePlus, Pencil, Plus, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatPrice, listingTypeLabel, listingTypeOptions, priceUnitLabel, priceUnitOptions, type SupplierListingType, type SupplierPriceUnit } from "@/lib/catalog";

type CatalogImage = { id: string; url: string; pathname: string; altText: string | null };
type CatalogListing = {
  id: string;
  type: SupplierListingType;
  name: string;
  description: string;
  priceCents: number;
  priceUnit: SupplierPriceUnit;
  capacity: number | null;
  city: string | null;
  state: string | null;
  status: "DRAFT" | "PUBLISHED";
  images: CatalogImage[];
};

type FormState = {
  type: SupplierListingType;
  name: string;
  description: string;
  price: string;
  priceUnit: SupplierPriceUnit;
  capacity: string;
  city: string;
  state: string;
  published: boolean;
};

const emptyForm: FormState = {
  type: "VENUE",
  name: "",
  description: "",
  price: "",
  priceUnit: "PER_EVENT",
  capacity: "",
  city: "",
  state: "",
  published: false,
};

function safeFilename(filename: string) {
  return filename.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9._-]/g, "-").toLowerCase();
}

export function CatalogManager({ userId, initialListings }: { userId: string; initialListings: CatalogListing[] }) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [files, setFiles] = useState<File[]>([]);
  const [editing, setEditing] = useState<CatalogListing | null>(null);
  const [removedImageIds, setRemovedImageIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const previews = useMemo(() => files.map((file) => ({ file, url: URL.createObjectURL(file) })), [files]);

  useEffect(() => () => previews.forEach(({ url }) => URL.revokeObjectURL(url)), [previews]);

  const visibleExistingImages = editing?.images.filter((image) => !removedImageIds.includes(image.id)) ?? [];
  const totalImages = visibleExistingImages.length + files.length;
  const currentType = listingTypeOptions.find(({ value }) => value === form.type)!;
  const isVenue = form.type === "VENUE";
  const isDecoration = form.type === "DECORATION_THEME";

  function resetForm() {
    setForm(emptyForm);
    setFiles([]);
    setEditing(null);
    setRemovedImageIds([]);
  }

  function startEdit(listing: CatalogListing) {
    setEditing(listing);
    setRemovedImageIds([]);
    setFiles([]);
    setMessage(null);
    setForm({
      type: listing.type,
      name: listing.name,
      description: listing.description,
      price: (listing.priceCents / 100).toFixed(2),
      priceUnit: listing.priceUnit,
      capacity: listing.capacity?.toString() ?? "",
      city: listing.city ?? "",
      state: listing.state ?? "",
      published: listing.status === "PUBLISHED",
    });
    document.getElementById("catalog-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function selectFiles(selected: FileList | null) {
    const incoming = Array.from(selected ?? []);
    if (!incoming.length) return;
    if (incoming.some((file) => !["image/jpeg", "image/png", "image/webp"].includes(file.type))) {
      setMessage({ kind: "error", text: "Use somente fotos JPG, PNG ou WebP." });
      return;
    }
    if (incoming.some((file) => file.size > 5 * 1024 * 1024)) {
      setMessage({ kind: "error", text: "Cada foto pode ter no máximo 5 MB." });
      return;
    }
    if (totalImages + incoming.length > 8) {
      setMessage({ kind: "error", text: "Cada item pode ter no máximo oito fotos." });
      return;
    }
    setFiles((current) => [...current, ...incoming]);
    setMessage(null);
  }

  async function uploadPhotos() {
    const uploaded = [] as { url: string; pathname: string; altText: string }[];
    for (const [index, file] of files.entries()) {
      const pathname = `suppliers/${userId}/${Date.now()}-${index}-${safeFilename(file.name)}`;
      const blob = await upload(pathname, file, {
        access: "private",
        handleUploadUrl: "/api/supplier/uploads",
      });
      uploaded.push({ url: blob.url, pathname: blob.pathname, altText: form.name });
    }
    return uploaded;
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    const price = Number(form.price.replace(",", "."));
    if (!Number.isFinite(price) || price <= 0) {
      setMessage({ kind: "error", text: "Informe um preço válido." });
      return;
    }
    if (totalImages < 1) {
      setMessage({ kind: "error", text: `Adicione pelo menos uma foto do ${currentType.itemLabel}.` });
      return;
    }

    setBusy(true);
    try {
      const newImages = await uploadPhotos();
      const details = {
        type: form.type,
        name: form.name,
        description: form.description,
        priceCents: Math.round(price * 100),
        priceUnit: form.priceUnit,
        capacity: form.capacity ? Number(form.capacity) : null,
        city: form.city || null,
        state: form.state ? form.state.toUpperCase() : null,
        status: form.published ? "PUBLISHED" : "DRAFT",
      };
      const response = await fetch(editing ? `/api/supplier/listings/${editing.id}` : "/api/supplier/listings", {
        method: editing ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(editing ? { ...details, newImages, removedImageIds } : { ...details, images: newImages }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Não foi possível salvar.");
      resetForm();
      setMessage({ kind: "success", text: editing ? "Item atualizado com sucesso." : "Item cadastrado com sucesso." });
      router.refresh();
    } catch (error) {
      setMessage({ kind: "error", text: error instanceof Error ? error.message : "Não foi possível salvar." });
    } finally {
      setBusy(false);
    }
  }

  async function changeStatus(listing: CatalogListing) {
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/supplier/listings/${listing.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: listing.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED" }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Não foi possível alterar a publicação.");
      router.refresh();
    } catch (error) {
      setMessage({ kind: "error", text: error instanceof Error ? error.message : "Não foi possível alterar a publicação." });
    } finally {
      setBusy(false);
    }
  }

  async function deleteListing(listing: CatalogListing) {
    if (!window.confirm(`Excluir “${listing.name}” e suas fotos?`)) return;
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/supplier/listings/${listing.id}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Não foi possível excluir.");
      if (editing?.id === listing.id) resetForm();
      setMessage({ kind: "success", text: "Item excluído do catálogo." });
      router.refresh();
    } catch (error) {
      setMessage({ kind: "error", text: error instanceof Error ? error.message : "Não foi possível excluir." });
    } finally {
      setBusy(false);
    }
  }

  return <div className="catalog-layout">
    <section className="catalog-form-card" id="catalog-form">
      <div className="catalog-card-heading"><span>{editing ? "EDITAR ITEM" : "NOVO ITEM"}</span><h2>{editing ? editing.name : "Cadastrar uma oferta no portfólio"}</h2><p>Cadastre uma oferta por vez. Isso não limita os serviços da empresa: você pode criar vários espaços, buffets, temas de decoração e outros itens.</p></div>
      <form className="catalog-form" onSubmit={submit}>
        <fieldset className="catalog-type-picker">
          <legend>Categoria deste item do portfólio</legend>
          {listingTypeOptions.map((option) => <label key={option.value} className={form.type === option.value ? "selected" : ""}>
            <input type="radio" name="type" value={option.value} checked={form.type === option.value} onChange={() => setForm({ ...form, type: option.value })} />
            <strong>{option.label}</strong>
          </label>)}
        </fieldset>
        <div className="catalog-form-grid">
          <label className="full">{isDecoration ? "Nome do tema" : isVenue ? "Nome do espaço" : "Nome da oferta"}<input required minLength={3} maxLength={120} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder={isDecoration ? "Ex.: Jardim encantado" : isVenue ? "Ex.: Espaço Vila Verde" : "Ex.: Buffet completo"} /></label>
          <label className="full">Descrição<textarea required minLength={20} maxLength={2500} rows={5} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Conte o que está incluído, diferenciais e condições importantes." /></label>
          <label>Preço em reais<input required inputMode="decimal" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} placeholder="Ex.: 2500,00" /></label>
          <label>Forma de cobrança<select value={form.priceUnit} onChange={(event) => setForm({ ...form, priceUnit: event.target.value as SupplierPriceUnit })}>{priceUnitOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
          {isVenue && <><label>Capacidade máxima<input required type="number" min={1} value={form.capacity} onChange={(event) => setForm({ ...form, capacity: event.target.value })} placeholder="Quantidade de pessoas" /></label><label>Cidade<input required maxLength={100} value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} /></label><label>Estado (UF)<input required minLength={2} maxLength={2} value={form.state} onChange={(event) => setForm({ ...form, state: event.target.value.toUpperCase() })} placeholder="CE" /></label></>}
        </div>

        <div className="photo-field">
          <div><strong><Camera size={18} /> Fotos do {currentType.itemLabel}</strong><small>De 1 a 8 fotos em JPG, PNG ou WebP. Máximo de 5 MB por foto.</small></div>
          <label className="photo-picker"><ImagePlus size={20} /><span>Selecionar fotos</span><input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(event) => { selectFiles(event.target.files); event.target.value = ""; }} /></label>
          {(visibleExistingImages.length > 0 || previews.length > 0) && <div className="photo-preview-grid">
            {visibleExistingImages.map((image) => <figure key={image.id}><img src={image.url} alt={image.altText || form.name} /><button type="button" title="Remover foto" onClick={() => setRemovedImageIds((current) => [...current, image.id])}><X size={15} /></button></figure>)}
            {previews.map(({ file, url }, index) => <figure key={`${file.name}-${file.lastModified}`}><img src={url} alt={`Nova foto ${index + 1}`} /><button type="button" title="Remover foto" onClick={() => setFiles((current) => current.filter((_, fileIndex) => fileIndex !== index))}><X size={15} /></button></figure>)}
          </div>}
        </div>

        <label className="publish-check"><input type="checkbox" checked={form.published} onChange={(event) => setForm({ ...form, published: event.target.checked })} /><span><strong>Publicar no catálogo</strong><small>Desmarque para manter como rascunho.</small></span></label>
        {message && <p className={`form-message ${message.kind}`}>{message.text}</p>}
        <div className="catalog-form-actions">{editing && <button type="button" className="secondary-button" onClick={resetForm} disabled={busy}>Cancelar edição</button>}<button type="submit" className="primary-button" disabled={busy}>{busy ? "Salvando..." : <><Plus size={17} /> {editing ? "Salvar alterações" : "Cadastrar item"}</>}</button></div>
      </form>
    </section>

    <section className="catalog-list-section">
      <div className="catalog-list-heading"><div><span>MEU CATÁLOGO</span><h2>{initialListings.length} {initialListings.length === 1 ? "item cadastrado" : "itens cadastrados"}</h2></div><p>Somente os itens publicados poderão ser apresentados aos clientes.</p></div>
      {initialListings.length === 0 ? <div className="catalog-empty"><ImagePlus size={35} /><h3>Seu catálogo ainda está vazio</h3><p>Cadastre o primeiro espaço, buffet, tema de decoração ou serviço.</p></div> : <div className="catalog-grid">
        {initialListings.map((listing) => <article className="catalog-item" key={listing.id}>
          <div className="catalog-cover">{listing.images[0] ? <img src={listing.images[0].url} alt={listing.images[0].altText || listing.name} /> : <ImagePlus size={30} />}<span className={`catalog-status ${listing.status.toLowerCase()}`}>{listing.status === "PUBLISHED" ? <><Check size={12} /> Publicado</> : "Rascunho"}</span>{listing.images.length > 1 && <small>{listing.images.length} fotos</small>}</div>
          <div className="catalog-item-body"><span>{listingTypeLabel(listing.type)}</span><h3>{listing.name}</h3><p>{listing.description}</p>{listing.type === "VENUE" && <small>{listing.city}/{listing.state} · até {listing.capacity} pessoas</small>}<div className="catalog-price"><strong>{formatPrice(listing.priceCents)}</strong><span>{priceUnitLabel(listing.priceUnit)}</span></div><div className="catalog-item-actions"><button type="button" onClick={() => startEdit(listing)} disabled={busy}><Pencil size={14} /> Editar</button><button type="button" onClick={() => changeStatus(listing)} disabled={busy}>{listing.status === "PUBLISHED" ? "Tirar do ar" : "Publicar"}</button><button type="button" className="danger" onClick={() => deleteListing(listing)} disabled={busy}><Trash2 size={14} /></button></div></div>
        </article>)}
      </div>}
    </section>
  </div>;
}
