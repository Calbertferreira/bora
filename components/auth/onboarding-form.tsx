"use client";

import { FormEvent, useEffect, useState } from "react";

type PublicRole = "CLIENT" | "SUPPLIER";

export function OnboardingForm() {
  const [role, setRole] = useState<PublicRole>("CLIENT");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const savedRole = window.sessionStorage.getItem("bora:signup-role");
    if (savedRole === "SUPPLIER") setRole("SUPPLIER");
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        role,
        whatsappNumber: String(form.get("whatsappNumber")),
        whatsappName: String(form.get("whatsappName")),
        acceptsOperationalMessages: true,
        acceptsMarketing: form.get("acceptsMarketing") === "on",
        acceptedTerms: form.get("acceptedTerms") === "on",
        businessName: role === "SUPPLIER" ? String(form.get("businessName")) : undefined,
        serviceCategory: role === "SUPPLIER" ? String(form.get("serviceCategory")) : undefined,
      }),
    });
    const result = await response.json();
    if (!response.ok) {
      setMessage(result.error ?? "Não foi possível concluir o cadastro.");
      setLoading(false);
      return;
    }
    window.sessionStorage.removeItem("bora:signup-role");
    window.location.href = "/painel";
  }

  return <form className="auth-form" onSubmit={submit}>
    <fieldset className="role-picker">
      <legend>Escolha seu perfil</legend>
      <label className={role === "CLIENT" ? "selected" : ""}><input type="radio" checked={role === "CLIENT"} onChange={() => setRole("CLIENT")} /><strong>Cliente</strong><small>Planejar experiências</small></label>
      <label className={role === "SUPPLIER" ? "selected" : ""}><input type="radio" checked={role === "SUPPLIER"} onChange={() => setRole("SUPPLIER")} /><strong>Fornecedor</strong><small>Oferecer serviços</small></label>
    </fieldset>
    <div className="form-grid">
      <label>Nome no WhatsApp<input name="whatsappName" required minLength={2} /></label>
      <label>Número do WhatsApp<input name="whatsappNumber" type="tel" placeholder="(85) 99999-9999" required minLength={10} /></label>
      {role === "SUPPLIER" && <><label>Nome comercial<input name="businessName" required minLength={2} /></label><label>Categoria do serviço<input name="serviceCategory" required minLength={2} /></label></>}
    </div>
    <label className="check-row"><input name="acceptedTerms" type="checkbox" required /> Aceito os termos de uso e a política de privacidade.</label>
    <label className="check-row"><input name="acceptsMarketing" type="checkbox" /> Aceito receber novidades pelo WhatsApp.</label>
    {message && <p className="form-message error">{message}</p>}
    <button className="primary-button" disabled={loading}>{loading ? "Salvando..." : "Concluir cadastro"}</button>
  </form>;
}
