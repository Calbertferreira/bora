"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Supplier = { id: string; name: string };
type Contact = { id: string; name: string; email: string; whatsapp: string };
type Venue = { id: string; name: string; location: string };
type Item = { serviceName: string; description: string; providerKind: "SELF" | "REGISTERED" | "MANUAL"; providerSupplierId: string; providerName: string; amount: string };
type InitialPackage = {
  id: string;
  clientContactId: string;
  clientName: string;
  clientEmail: string;
  clientWhatsapp: string;
  venueListingId: string;
  eventType: string;
  eventTitle: string;
  eventDate: string;
  eventLocation: string;
  items: Item[];
};

const blankItem = (): Item => ({ serviceName: "", description: "", providerKind: "SELF", providerSupplierId: "", providerName: "", amount: "" });
const services = ["Espaço", "Buffet e alimentação", "Decoração", "Bolo e doces", "DJ ou banda", "Fotografia", "Filmagem", "Transporte", "Hospedagem", "Garçons", "Segurança", "Limpeza", "Outro"];

export function PackageBuilder({ suppliers, contacts, venues, administrationFeePercent, initial }: { suppliers: Supplier[]; contacts: Contact[]; venues: Venue[]; administrationFeePercent: number; initial?: InitialPackage }) {
  const router = useRouter();
  const [selectedContactId, setSelectedContactId] = useState(initial?.clientContactId ?? "");
  const [clientName, setClientName] = useState(initial?.clientName ?? "");
  const [clientEmail, setClientEmail] = useState(initial?.clientEmail ?? "");
  const [clientWhatsapp, setClientWhatsapp] = useState(initial?.clientWhatsapp ?? "");
  const [selectedVenueId, setSelectedVenueId] = useState(initial?.venueListingId ?? "");
  const [eventLocation, setEventLocation] = useState(initial?.eventLocation ?? "");
  const [items, setItems] = useState<Item[]>(initial?.items.length ? initial.items : [blankItem()]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const subtotal = useMemo(() => items.reduce((sum, item) => sum + (Number(item.amount.replace(",", ".")) || 0), 0), [items]);
  const fee = subtotal * administrationFeePercent / 100;
  const money = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  function chooseContact(id: string) {
    setSelectedContactId(id);
    const contact = contacts.find((entry) => entry.id === id);
    if (contact) {
      setClientName(contact.name);
      setClientEmail(contact.email);
      setClientWhatsapp(contact.whatsapp);
    } else {
      setClientName("");
      setClientEmail("");
      setClientWhatsapp("");
    }
  }

  function chooseVenue(id: string) {
    setSelectedVenueId(id);
    const venue = venues.find((entry) => entry.id === id);
    setEventLocation(venue?.location ?? "");
  }

  function update(index: number, patch: Partial<Item>) {
    setItems((current) => current.map((item, i) => i === index ? { ...item, ...patch } : item));
  }

  async function save(form: HTMLFormElement, sendToClient: boolean) {
    if (!form.reportValidity()) return;
    setBusy(true);
    setMessage("");
    const data = new FormData(form);
    const response = await fetch(initial ? `/api/supplier/packages/${initial.id}` : "/api/supplier/packages", {
      method: initial ? "PATCH" : "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        clientContactId: selectedContactId,
        clientName,
        clientEmail,
        clientWhatsapp,
        venueListingId: selectedVenueId,
        eventType: data.get("eventType"),
        eventTitle: data.get("eventTitle"),
        eventDate: data.get("eventDate"),
        eventLocation,
        sendToClient,
        items: items.map((item) => ({ ...item, amountCents: Math.round(Number(item.amount.replace(",", ".")) * 100) })),
      }),
    });
    const body = await response.json();
    setBusy(false);
    if (!response.ok) return setMessage(body.error ?? "Não foi possível salvar o evento.");
    setMessage(sendToClient ? "Evento salvo e disponibilizado ao cliente." : "Evento salvo como rascunho.");
    router.push("/fornecedor/pacotes");
    router.refresh();
  }

  return <form className="package-builder" onSubmit={(event) => { event.preventDefault(); save(event.currentTarget, false); }}>
    <div className="event-form-title"><div><span>{initial ? "EDITAR EVENTO" : "NOVO EVENTO"}</span><h2>{initial ? initial.eventTitle : "Cadastre o evento e monte o pacote"}</h2></div><a href="/fornecedor/pacotes">Voltar à lista</a></div>
    <section><span>CLIENTE E EVENTO</span><div className="package-fields">
      <label className="full">Localizar cliente<select value={selectedContactId} onChange={(event) => chooseContact(event.target.value)}><option value="">+ Cadastrar novo cliente</option>{contacts.map((contact) => <option key={contact.id} value={contact.id}>{contact.name} · {contact.whatsapp}</option>)}</select></label>
      <label>Nome do cliente<input value={clientName} onChange={(event) => setClientName(event.target.value)} required /></label>
      <label>E-mail do cliente<input value={clientEmail} onChange={(event) => setClientEmail(event.target.value)} type="email" required /></label>
      <label>WhatsApp (identificação)<input value={clientWhatsapp} onChange={(event) => setClientWhatsapp(event.target.value)} required placeholder="(85) 99999-9999" /></label>
      <label>Tipo de evento<select name="eventType" required defaultValue={initial?.eventType ?? "Aniversário infantil"}><option>Aniversário infantil</option><option>15 ou 16 anos</option><option>Aniversário adulto</option><option>Casamento</option><option>Bodas</option><option>Corporativo</option><option>Viagem ou hospedagem</option><option>Outro</option></select></label>
      <label>Título do evento<input name="eventTitle" defaultValue={initial?.eventTitle} required placeholder="Ex.: Aniversário de 50 anos" /></label>
      <label>Data<input name="eventDate" defaultValue={initial?.eventDate} type="date" /></label>
      <label className="full">Localizar local cadastrado<select value={selectedVenueId} onChange={(event) => chooseVenue(event.target.value)}><option value="">+ Informar outro local</option>{venues.map((venue) => <option key={venue.id} value={venue.id}>{venue.name}{venue.location ? ` · ${venue.location}` : ""}</option>)}</select></label>
      <label className="full">Local do evento<input value={eventLocation} onChange={(event) => { setEventLocation(event.target.value); if (selectedVenueId) setSelectedVenueId(""); }} placeholder="Espaço, cidade ou endereço" /></label>
    </div></section>
    <section><div className="invoice-heading"><div><span>GRADE FINANCEIRA</span><h2>Serviços e recebedores</h2></div><button type="button" onClick={() => setItems([...items, blankItem()])}>+ Adicionar item</button></div><div className="invoice-grid"><div className="invoice-row header"><span>Serviço</span><span>Fornecedor / recebedor</span><span>Descrição</span><span>Valor</span><span /></div>{items.map((item, index) => <div className="invoice-row" key={index}>
      <select required value={item.serviceName} onChange={(event) => update(index, { serviceName: event.target.value })}><option value="">Selecione</option>{services.map((service) => <option key={service}>{service}</option>)}</select>
      <div><select value={item.providerKind} onChange={(event) => update(index, { providerKind: event.target.value as Item["providerKind"], providerSupplierId: "", providerName: "" })}><option value="SELF">Minha empresa</option><option value="REGISTERED">Fornecedor cadastrado</option><option value="MANUAL">Fornecedor livre</option></select>{item.providerKind === "REGISTERED" && <select required value={item.providerSupplierId} onChange={(event) => update(index, { providerSupplierId: event.target.value })}><option value="">Selecione</option>{suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}</select>}{item.providerKind === "MANUAL" && <input required value={item.providerName} onChange={(event) => update(index, { providerName: event.target.value })} placeholder="Nome do fornecedor" />}</div>
      <input value={item.description} onChange={(event) => update(index, { description: event.target.value })} placeholder="Detalhes" /><input required inputMode="decimal" value={item.amount} onChange={(event) => update(index, { amount: event.target.value })} placeholder="0,00" /><button type="button" disabled={items.length === 1} onClick={() => setItems(items.filter((_, i) => i !== index))}>×</button>
    </div>)}</div><div className="invoice-total"><span>Subtotal <strong>{money(subtotal)}</strong></span><span>Taxa administrativa ({administrationFeePercent.toLocaleString("pt-BR")}%) <strong>{money(fee)}</strong></span><span>Total do pacote <strong>{money(subtotal + fee)}</strong></span></div></section>
    {message && <p className="form-message">{message}</p>}<div className="package-actions"><button disabled={busy} type="submit">Salvar rascunho</button><button className="primary" disabled={busy} type="button" onClick={(event) => save(event.currentTarget.form!, true)}>{busy ? "Salvando..." : "Salvar e enviar ao cliente"}</button></div>
  </form>;
}
