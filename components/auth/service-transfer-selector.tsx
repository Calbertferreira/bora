"use client";

import { ArrowLeft, ArrowRight, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import type { ServiceOption } from "@/lib/services";

export type SelectedService = ServiceOption & { custom?: boolean };

export function ServiceTransferSelector({ suggestions, selected, onChange }: {
  suggestions: ServiceOption[];
  selected: SelectedService[];
  onChange: (services: SelectedService[]) => void;
}) {
  const [customName, setCustomName] = useState("");
  const selectedKeys = useMemo(() => new Set(selected.map(({ id }) => id)), [selected]);
  const available = suggestions.filter(({ id }) => !selectedKeys.has(id));

  function addSuggested(service: ServiceOption) { onChange([...selected, service]); }
  function removeSelected(service: SelectedService) { onChange(selected.filter(({ id }) => id !== service.id)); }
  function addCustom() {
    const name = customName.trim().replace(/\s+/g, " ");
    if (name.length < 2) return;
    const existing = suggestions.find((service) => service.name.localeCompare(name, "pt-BR", { sensitivity: "base" }) === 0);
    if (existing) {
      if (!selectedKeys.has(existing.id)) addSuggested(existing);
    } else {
      const customId = `custom:${name.toLocaleLowerCase("pt-BR")}`;
      if (!selectedKeys.has(customId)) onChange([...selected, { id: customId, name, custom: true }]);
    }
    setCustomName("");
  }

  return <div className="service-selector full">
    <div className="service-selector-heading"><strong>Quais serviços sua empresa oferece?</strong><small>Clique nos serviços para movimentá-los entre as duas caixas.</small></div>
    <div className="service-transfer">
      <section><header><span>Serviços sugeridos</span><b>{available.length}</b></header><div className="service-options">
        {available.length ? available.map((service) => <button type="button" key={service.id} onClick={() => addSuggested(service)}><span>{service.name}</span><ArrowRight size={15} aria-hidden="true" /></button>) : <p>Todos os serviços foram escolhidos.</p>}
      </div></section>
      <section className="selected-services"><header><span>Serviços escolhidos</span><b>{selected.length}</b></header><div className="service-options">
        {selected.length ? selected.map((service) => <button type="button" key={service.id} onClick={() => removeSelected(service)}><ArrowLeft size={15} aria-hidden="true" /><span>{service.name}</span>{service.custom && <em>Novo</em>}</button>) : <p>Escolha pelo menos um serviço.</p>}
      </div></section>
    </div>
    <div className="custom-service-row"><label>Não encontrou o serviço?<input value={customName} onChange={(event) => setCustomName(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addCustom(); } }} placeholder="Digite um novo serviço" maxLength={80} /></label><button type="button" className="secondary-button" onClick={addCustom} disabled={customName.trim().length < 2}><Plus size={16} /> Incluir serviço</button></div>
    <p className="service-learning-note">Serviços novos serão acrescentados às sugestões dos próximos fornecedores.</p>
  </div>;
}
