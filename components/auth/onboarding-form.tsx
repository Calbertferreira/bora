"use client";

import { FormEvent, useEffect, useState } from "react";
import { ServiceTransferSelector, type SelectedService } from "@/components/auth/service-transfer-selector";
import type { ServiceOption } from "@/lib/services";

type PublicRole = "CLIENT" | "SUPPLIER";

export function OnboardingForm({ serviceSuggestions }: { serviceSuggestions: ServiceOption[] }) {
  const [role, setRole] = useState<PublicRole>("CLIENT");
  const [selectedServices, setSelectedServices] = useState<SelectedService[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => { if (window.sessionStorage.getItem("bora:signup-role") === "SUPPLIER") setRole("SUPPLIER"); }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setMessage("");
    if (role === "SUPPLIER" && selectedServices.length === 0) { setMessage("Escolha pelo menos um serviço oferecido."); setLoading(false); return; }
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/onboarding", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({
      role,
      whatsappNumber: String(form.get("whatsappNumber")),
      whatsappName: String(form.get("whatsappName")),
      acceptsOperationalMessages: true,
      acceptsMarketing: form.get("acceptsMarketing") === "on",
      acceptedTerms: form.get("acceptedTerms") === "on",
      businessName: role === "SUPPLIER" ? String(form.get("businessName")) : undefined,
      serviceIds: role === "SUPPLIER" ? selectedServices.filter(({ custom }) => !custom).map(({ id }) => id) : undefined,
      customServices: role === "SUPPLIER" ? selectedServices.filter(({ custom }) => custom).map(({ name }) => name) : undefined,
    }) });
    const result = await response.json();
    if (!response.ok) { setMessage(result.error ?? "Não foi possível concluir o cadastro."); setLoading(false); return; }
    window.sessionStorage.removeItem("bora:signup-role"); window.location.href = "/painel";
  }

  return <form className="auth-form" onSubmit={submit}>
    <fieldset className="role-picker"><legend>Escolha seu perfil</legend><label className={role === "CLIENT" ? "selected" : ""}><input type="radio" checked={role === "CLIENT"} onChange={() => setRole("CLIENT")} /><strong>Cliente</strong><small>Planejar experiências</small></label><label className={role === "SUPPLIER" ? "selected" : ""}><input type="radio" checked={role === "SUPPLIER"} onChange={() => setRole("SUPPLIER")} /><strong>Fornecedor</strong><small>Oferecer serviços</small></label></fieldset>
    <div className="form-grid"><label>Nome no WhatsApp<input name="whatsappName" required minLength={2} /></label><label>Número do WhatsApp<input name="whatsappNumber" type="tel" placeholder="(85) 99999-9999" required minLength={10} /></label>{role === "SUPPLIER" && <><label className="full">Nome comercial<input name="businessName" required minLength={2} /></label><ServiceTransferSelector suggestions={serviceSuggestions} selected={selectedServices} onChange={setSelectedServices} /></>}</div>
    <label className="check-row"><input name="acceptedTerms" type="checkbox" required /> Aceito os termos de uso e a política de privacidade.</label><label className="check-row"><input name="acceptsMarketing" type="checkbox" /> Aceito receber novidades pelo WhatsApp.</label>
    {message && <p className="form-message error">{message}</p>}<button className="primary-button" disabled={loading}>{loading ? "Salvando..." : "Concluir cadastro"}</button>
  </form>;
}
