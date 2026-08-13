"use client";

import { Save } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ServiceTransferSelector, type SelectedService } from "@/components/auth/service-transfer-selector";
import type { ServiceOption } from "@/lib/services";

export function SupplierServicesManager({ initialSuggestions, initialSelected }: {
  initialSuggestions: ServiceOption[];
  initialSelected: ServiceOption[];
}) {
  const router = useRouter();
  const [suggestions, setSuggestions] = useState(initialSuggestions);
  const [selected, setSelected] = useState<SelectedService[]>(initialSelected);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null);

  async function saveServices() {
    if (!selected.length) {
      setMessage({ kind: "error", text: "Escolha pelo menos um serviço oferecido pela empresa." });
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/supplier/services", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          serviceIds: selected.filter(({ custom }) => !custom).map(({ id }) => id),
          customServices: selected.filter(({ custom }) => custom).map(({ name }) => name),
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Não foi possível atualizar os serviços.");
      const savedServices = result.services as ServiceOption[];
      setSelected(savedServices);
      setSuggestions((current) => [...current, ...savedServices]
        .filter((service, index, all) => all.findIndex(({ id }) => id === service.id) === index)
        .sort((left, right) => left.name.localeCompare(right.name, "pt-BR")));
      setMessage({ kind: "success", text: "Serviços da empresa atualizados com sucesso." });
      router.refresh();
    } catch (error) {
      setMessage({ kind: "error", text: error instanceof Error ? error.message : "Não foi possível atualizar os serviços." });
    } finally {
      setBusy(false);
    }
  }

  return <section className="supplier-services-card">
    <div className="catalog-card-heading">
      <span>ATUAÇÃO DA EMPRESA</span>
      <h2>Tipos de serviços oferecidos</h2>
      <p>Selecione todos os serviços que sua empresa oferece. Você poderá alterar esta lista sempre que precisar.</p>
    </div>
    <ServiceTransferSelector suggestions={suggestions} selected={selected} onChange={setSelected} />
    {message && <p className={`form-message ${message.kind}`} role="status">{message.text}</p>}
    <div className="supplier-services-actions">
      <small>{selected.length} {selected.length === 1 ? "serviço selecionado" : "serviços selecionados"}</small>
      <button type="button" className="primary-button" onClick={saveServices} disabled={busy || !selected.length}>
        <Save size={16} /> {busy ? "Salvando..." : "Salvar serviços da empresa"}
      </button>
    </div>
  </section>;
}
