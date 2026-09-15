"use client";

import { useMemo, useState } from "react";

type Supplier = { id: string; name: string };
type Item = { serviceName: string; description: string; providerKind: "SELF" | "REGISTERED" | "MANUAL"; providerSupplierId: string; providerName: string; amount: string };
const blankItem = (): Item => ({ serviceName: "", description: "", providerKind: "SELF", providerSupplierId: "", providerName: "", amount: "" });
const services = ["Espaço", "Buffet e alimentação", "Decoração", "Bolo e doces", "DJ ou banda", "Fotografia", "Filmagem", "Transporte", "Hospedagem", "Garçons", "Segurança", "Limpeza", "Outro"];

export function PackageBuilder({ suppliers, administrationFeePercent }: { suppliers: Supplier[]; administrationFeePercent: number }) {
  const [items, setItems] = useState<Item[]>([blankItem()]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const subtotal = useMemo(() => items.reduce((sum, item) => sum + (Number(item.amount.replace(",", ".")) || 0), 0), [items]);
  const fee = subtotal * administrationFeePercent / 100;
  const money = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  function update(index: number, patch: Partial<Item>) { setItems((current) => current.map((item, i) => i === index ? { ...item, ...patch } : item)); }
  async function save(form: HTMLFormElement, sendToClient: boolean) {
    if (!form.reportValidity()) return;
    setBusy(true); setMessage(""); const data = new FormData(form);
    const response = await fetch("/api/supplier/packages", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({
      clientName: data.get("clientName"), clientEmail: data.get("clientEmail"), clientWhatsapp: data.get("clientWhatsapp"), eventType: data.get("eventType"), eventTitle: data.get("eventTitle"), eventDate: data.get("eventDate"), eventLocation: data.get("eventLocation"), sendToClient,
      items: items.map((item) => ({ ...item, amountCents: Math.round(Number(item.amount.replace(",", ".")) * 100) })),
    }) });
    const body = await response.json(); setBusy(false);
    if (!response.ok) return setMessage(body.error ?? "Não foi possível salvar o pacote.");
    setMessage(body.clientLinked ? (sendToClient ? "Pacote enviado ao painel do cliente." : "Pacote salvo como rascunho.") : "Pacote salvo. O e-mail informado ainda não possui conta de cliente no BORA.");
    window.setTimeout(() => window.location.reload(), 1000);
  }

  return <form className="package-builder" onSubmit={(event) => { event.preventDefault(); save(event.currentTarget, false); }}>
    <section><span>CLIENTE E EVENTO</span><div className="package-fields"><label>Nome do cliente<input name="clientName" required /></label><label>E-mail do cliente<input name="clientEmail" type="email" required /></label><label>WhatsApp<input name="clientWhatsapp" /></label><label>Tipo de evento<select name="eventType" required><option>Aniversário infantil</option><option>15 ou 16 anos</option><option>Aniversário adulto</option><option>Casamento</option><option>Bodas</option><option>Corporativo</option><option>Viagem ou hospedagem</option><option>Outro</option></select></label><label>Título do evento<input name="eventTitle" required placeholder="Ex.: Aniversário de 50 anos" /></label><label>Data<input name="eventDate" type="date" /></label><label className="full">Local<input name="eventLocation" placeholder="Espaço, cidade ou endereço" /></label></div></section>
    <section><div className="invoice-heading"><div><span>GRADE FINANCEIRA</span><h2>Serviços e recebedores</h2></div><button type="button" onClick={() => setItems([...items, blankItem()])}>+ Adicionar item</button></div><div className="invoice-grid"><div className="invoice-row header"><span>Serviço</span><span>Fornecedor / recebedor</span><span>Descrição</span><span>Valor</span><span /></div>{items.map((item, index) => <div className="invoice-row" key={index}>
      <select required value={item.serviceName} onChange={(event) => update(index, { serviceName: event.target.value })}><option value="">Selecione</option>{services.map((service) => <option key={service}>{service}</option>)}</select>
      <div><select value={item.providerKind} onChange={(event) => update(index, { providerKind: event.target.value as Item["providerKind"], providerSupplierId: "", providerName: "" })}><option value="SELF">Minha empresa</option><option value="REGISTERED">Fornecedor cadastrado</option><option value="MANUAL">Fornecedor livre</option></select>{item.providerKind === "REGISTERED" && <select required value={item.providerSupplierId} onChange={(event) => update(index, { providerSupplierId: event.target.value })}><option value="">Selecione</option>{suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}</select>}{item.providerKind === "MANUAL" && <input required value={item.providerName} onChange={(event) => update(index, { providerName: event.target.value })} placeholder="Nome do fornecedor" />}</div>
      <input value={item.description} onChange={(event) => update(index, { description: event.target.value })} placeholder="Detalhes" /><input required inputMode="decimal" value={item.amount} onChange={(event) => update(index, { amount: event.target.value })} placeholder="0,00" /><button type="button" disabled={items.length === 1} onClick={() => setItems(items.filter((_, i) => i !== index))}>×</button>
    </div>)}</div><div className="invoice-total"><span>Subtotal <strong>{money(subtotal)}</strong></span><span>Taxa administrativa ({administrationFeePercent.toLocaleString("pt-BR") }%) <strong>{money(fee)}</strong></span><span>Total do pacote <strong>{money(subtotal + fee)}</strong></span></div></section>
    {message && <p className="form-message success">{message}</p>}<div className="package-actions"><button disabled={busy} type="submit">Salvar rascunho</button><button className="primary" disabled={busy} type="button" onClick={(event) => save(event.currentTarget.form!, true)}>{busy ? "Salvando..." : "Salvar e enviar ao cliente"}</button></div>
  </form>;
}
