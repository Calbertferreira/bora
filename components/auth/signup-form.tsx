"use client";

import { FormEvent, useState } from "react";
import { PasswordField } from "@/components/auth/password-field";
import { ServiceTransferSelector, type SelectedService } from "@/components/auth/service-transfer-selector";
import { authClient } from "@/lib/auth-client";
import type { ServiceOption } from "@/lib/services";

type PublicRole = "CLIENT" | "SUPPLIER";

export function SignupForm({ googleEnabled, initialRole, serviceSuggestions }: { googleEnabled: boolean; initialRole: PublicRole; serviceSuggestions: ServiceOption[] }) {
  const [role, setRole] = useState<PublicRole>(initialRole);
  const [selectedServices, setSelectedServices] = useState<SelectedService[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function signup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password"));
    if (password !== String(form.get("passwordConfirmation"))) {
      setMessage("As senhas não coincidem."); setLoading(false); return;
    }
    if (role === "SUPPLIER" && selectedServices.length === 0) {
      setMessage("Escolha pelo menos um serviço oferecido."); setLoading(false); return;
    }

    const authResult = await authClient.signUp.email({ name: String(form.get("name")), email: String(form.get("email")), password });
    if (authResult.error) {
      setMessage(authResult.error.code === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL" ? "Este e-mail já está cadastrado." : "Não foi possível criar a conta. Revise os dados.");
      setLoading(false); return;
    }

    const onboarding = await fetch("/api/onboarding", {
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
        serviceIds: role === "SUPPLIER" ? selectedServices.filter(({ custom }) => !custom).map(({ id }) => id) : undefined,
        customServices: role === "SUPPLIER" ? selectedServices.filter(({ custom }) => custom).map(({ name }) => name) : undefined,
      }),
    });
    if (!onboarding.ok) {
      setMessage("Sua conta foi criada. Conclua os dados para continuar.");
      window.setTimeout(() => { window.location.href = "/onboarding"; }, 1200); return;
    }
    window.location.href = "/painel";
  }

  async function signupWithGoogle() {
    if (!googleEnabled) return;
    setLoading(true);
    window.sessionStorage.setItem("bora:signup-role", role);
    await authClient.signIn.social({ provider: "google", callbackURL: "/onboarding" });
  }

  return <form className="auth-form" onSubmit={signup}>
    <fieldset className="role-picker"><legend>Como você usará o BORA?</legend>
      <label className={role === "CLIENT" ? "selected" : ""}><input type="radio" name="role" value="CLIENT" checked={role === "CLIENT"} onChange={() => setRole("CLIENT")} /><strong>Cliente</strong><small>Quero planejar experiências</small></label>
      <label className={role === "SUPPLIER" ? "selected" : ""}><input type="radio" name="role" value="SUPPLIER" checked={role === "SUPPLIER"} onChange={() => setRole("SUPPLIER")} /><strong>Fornecedor</strong><small>Quero oferecer serviços</small></label>
    </fieldset>
    <div className="form-grid">
      <label className="full">Nome completo<input name="name" autoComplete="name" required minLength={2} /></label>
      <label>E-mail<input name="email" type="email" autoComplete="email" required /></label>
      <label>Nome no WhatsApp<input name="whatsappName" autoComplete="name" placeholder="Como aparece no WhatsApp" required minLength={2} /></label>
      <label className="full">Número do WhatsApp<input name="whatsappNumber" type="tel" autoComplete="tel" placeholder="(85) 99999-9999" required minLength={10} /></label>
      {role === "SUPPLIER" && <><label className="full">Nome comercial<input name="businessName" required minLength={2} /></label><ServiceTransferSelector suggestions={serviceSuggestions} selected={selectedServices} onChange={setSelectedServices} /></>}
      <PasswordField label="Senha" name="password" autoComplete="new-password" minLength={8} />
      <PasswordField label="Confirmar senha" name="passwordConfirmation" autoComplete="new-password" minLength={8} />
    </div>
    <label className="check-row"><input name="acceptedTerms" type="checkbox" required /> Li e aceito os termos de uso e a política de privacidade.</label>
    <label className="check-row"><input name="acceptsMarketing" type="checkbox" /> Quero receber novidades e ofertas pelo WhatsApp.</label>
    {role === "SUPPLIER" && <p className="supplier-note">O cadastro de fornecedor passa por uma análise antes da liberação dos serviços e preços.</p>}
    {message && <p className="form-message error" role="alert">{message}</p>}
    <button className="primary-button" disabled={loading}>{loading ? "Criando sua conta..." : "Criar conta"}</button>
    <div className="auth-divider"><span>ou</span></div>
    <button className="social-button" type="button" onClick={signupWithGoogle} disabled={!googleEnabled || loading}><span className="google-mark">G</span>{googleEnabled ? "Cadastrar com Google" : "Google disponível em breve"}</button>
    <p className="auth-switch">Já tem uma conta? <a href="/entrar">Entrar</a></p>
  </form>;
}
