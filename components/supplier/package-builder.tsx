"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Supplier = { id: string; name: string };
type Contact = { id: string; name: string; email: string; whatsapp: string };
type EventLocation = { id: string; name: string; address: string; city: string; state: string };
type Item = { serviceName: string; description: string; providerKind: "SELF" | "REGISTERED" | "MANUAL"; providerSupplierId: string; providerName: string; amount: string };
type InitialPackage = {
  id: string;
  clientContactId: string;
  clientName: string;
  clientEmail: string;
  clientWhatsapp: string;
  eventLocationId: string;
  locationName: string;
  locationAddress: string;
  locationCity: string;
  locationState: string;
  eventType: string;
  eventTitle: string;
  eventDate: string;
  items: Item[];
};

const blankItem = (): Item => ({ serviceName: "", description: "", providerKind: "SELF", providerSupplierId: "", providerName: "", amount: "" });
const services = ["Espaço", "Buffet e alimentação", "Decoração", "Bolo e doces", "DJ ou banda", "Fotografia", "Filmagem", "Transporte", "Hospedagem", "Garçons", "Segurança", "Limpeza", "Outro"];

export function PackageBuilder({ suppliers, contacts, locations, administrationFeePercent, initial }: { suppliers: Supplier[]; contacts: Contact[]; locations: EventLocation[]; administrationFeePercent: number; initial?: InitialPackage }) {
  const router = useRouter();
  const [selectedContactId, setSelectedContactId] = useState(initial?.clientContactId ?? "");
  const [clientName, setClientName] = useState(initial?.clientName ?? "");
  const [clientEmail, setClientEmail] = useState(initial?.clientEmail ?? "");
  const [clientWhatsapp, setClientWhatsapp] = useState(initial?.clientWhatsapp ?? "");
  const [selectedLocationId, setSelectedLocationId] = useState(initial?.eventLocationId ?? "");
  const [locationName, setLocationName] = useState(initial?.locationName ?? "");
  const [locationAddress, setLocationAddress] = useState(initial?.locationAddress ?? "");
  const [locationCity, setLocationCity] = useState(initial?.locationCity ?? "");
  const [locationState, setLocationState] = useState(initial?.locationState ?? "");
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

  function chooseLocation(id: string) {
    setSelectedLocationId(id);
    const location = locations.find((entry) => entry.id === id);
    setLocationName(location?.name ?? "");
    setLocationAddress(location?.address ?? "");
    setLocationCity(location?.city ?? "");
    setLocationState(location?.state ?? "");
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
        eventLocationId: selectedLocationId,
        locationName,
        locationAddress,
        locationCity,
        locationState,
        eventType: data.get("eventType"),
        eventTitle: data.get("eventTitle"),
        eventDate: data.get("eventDate"),
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
      <label className="full">Local do evento<select value={selectedLocationId} onChange={(event) => chooseLocation(event.target.value)}><option value="">+ Pré-cadastrar novo local</option>{locations.map((location) => <option key={location.id} value={location.id}>{location.name} · {location.address}</option>)}</select></label>
      <label>Nome do local<input value={locationName} readOnly={Boolean(selectedLocationId)} onChange={(event) => setLocationName(event.target.value)} required placeholder="Ex.: Espaço Vila Verde" /></label>
      <label className="full">Endereço completo (identificação)<input value={locationAddress} readOnly={Boolean(selectedLocationId)} onChange={(event) => setLocationAddress(event.target.value)} required minLength={5} placeholder="Rua, número, complemento e bairro" /></label>
      <label>Cidade<input value={locationCity} readOnly={Boolean(selectedLocationId)} onChange={(event) => setLocationCity(event.target.value)} placeholder="Fortaleza" /></label>
      <label>Estado (UF)<input value={locationState} readOnly={Boolean(selectedLocationId)} maxLength={2} onChange={(event) => setLocationState(event.target.value.toUpperCase())} placeholder="CE" /></label>
      {!selectedLocationId && <small className="location-help">Ao salvar, este endereço ficará disponível para os próximos eventos. Endereços iguais serão reconhecidos como o mesmo local.</small>}
    </div></section>
    <section><div className="invoice-heading"><div><span>GRADE FINANCEIRA</span><h2>Serviços e recebedores</h2></div><button type="button" onClick={() => setItems([...items, blankItem()])}>+ Adicionar item</button></div><div className="invoice-grid"><div className="invoice-row header"><span>Serviço</span><span>Fornecedor / recebedor</span><span>Descrição</span><span>Valor</span><span /></div>{items.map((item, index) => <div className="invoice-row" key={index}>
      <select required value={item.serviceName} onChange={(event) => update(index, { serviceName: event.target.value })}><option value="">Selecione</option>{services.map((service) => <option key={service}>{service}</option>)}</select>
      <div><select value={item.providerKind} onChange={(event) => update(index, { providerKind: event.target.value as Item["providerKind"], providerSupplierId: "", providerName: "" })}><option value="SELF">Minha empresa</option><option value="REGISTERED">Fornecedor cadastrado</option><option value="MANUAL">Fornecedor livre</option></select>{item.providerKind === "REGISTERED" && <select required value={item.providerSupplierId} onChange={(event) => update(index, { providerSupplierId: event.target.value })}><option value="">Selecione</option>{suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}</select>}{item.providerKind === "MANUAL" && <input required value={item.providerName} onChange={(event) => update(index, { providerName: event.target.value })} placeholder="Nome do fornecedor" />}</div>
      <input value={item.description} onChange={(event) => update(index, { description: event.target.value })} placeholder="Detalhes" /><input required inputMode="decimal" value={item.amount} onChange={(event) => update(index, { amount: event.target.value })} placeholder="0,00" /><button type="button" disabled={items.length === 1} onClick={() => setItems(items.filter((_, i) => i !== index))}>×</button>
    </div>)}</div><div className="invoice-total"><span>Subtotal <strong>{money(subtotal)}</strong></span><span>Taxa administrativa ({administrationFeePercent.toLocaleString("pt-BR")}%) <strong>{money(fee)}</strong></span><span>Total do pacote <strong>{money(subtotal + fee)}</strong></span></div></section>
    {message && <p className="form-message">{message}</p>}<div className="package-actions"><button disabled={busy} type="submit">Salvar rascunho</button><button className="primary" disabled={busy} type="button" onClick={(event) => save(event.currentTarget.form!, true)}>{busy ? "Salvando..." : "Salvar e enviar ao cliente"}</button></div>
  </form>;
}
