"use client";

import { FormEvent, useState } from "react";
import { authClient } from "@/lib/auth-client";

type Props = {
  token: string;
  email: string;
  name: string;
  roleName: string;
  createAccount: boolean;
  needsTerms: boolean;
  googleEnabled: boolean;
  defaultWhatsappName: string;
  defaultWhatsappNumber: string;
};

export function InvitationAcceptForm(props: Props) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const form = new FormData(event.currentTarget);

    if (props.createAccount) {
      const password = String(form.get("password"));
      if (password !== String(form.get("passwordConfirmation"))) {
        setMessage("As senhas não coincidem.");
        setLoading(false);
        return;
      }
      const signup = await authClient.signUp.email({ name: props.name, email: props.email, password });
      if (signup.error) {
        setMessage("Não foi possível criar a conta. Se ela já existir, entre antes de aceitar o convite.");
        setLoading(false);
        return;
      }
    }

    const response = await fetch("/api/invitations/accept", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        token: props.token,
        whatsappName: form.get("whatsappName"),
        whatsappNumber: form.get("whatsappNumber"),
        acceptedTerms: form.get("acceptedTerms") === "on",
      }),
    });
    const payload = await response.json();
    if (!response.ok) {
      setMessage(payload.error ?? "Não foi possível aceitar o convite.");
      setLoading(false);
      return;
    }
    window.location.href = "/painel";
  }

  async function continueWithGoogle() {
    setLoading(true);
    await authClient.signIn.social({ provider: "google", callbackURL: `/convite/${props.token}` });
  }

  return <form className="auth-form" onSubmit={submit}>
    <div className="invitation-summary"><span>VOCÊ FOI CONVIDADO COMO</span><strong>{props.roleName}</strong><small>{props.email}</small></div>
    <div className="form-grid">
      <label className="full">Nome completo<input value={props.name} readOnly /></label>
      <label>Nome no WhatsApp<input name="whatsappName" defaultValue={props.defaultWhatsappName} required minLength={2} /></label>
      <label>Número do WhatsApp<input name="whatsappNumber" type="tel" defaultValue={props.defaultWhatsappNumber} required minLength={10} placeholder="(85) 99999-9999" /></label>
      {props.createAccount && <>
        <label>Crie uma senha<input name="password" type="password" autoComplete="new-password" minLength={8} required /></label>
        <label>Confirme a senha<input name="passwordConfirmation" type="password" autoComplete="new-password" minLength={8} required /></label>
      </>}
    </div>
    {props.needsTerms && <label className="check-row"><input name="acceptedTerms" type="checkbox" required /> Li e aceito os termos de uso e a política de privacidade.</label>}
    {message && <p className="form-message error" role="alert">{message}</p>}
    <button className="primary-button" disabled={loading}>{loading ? "Processando..." : props.createAccount ? "Criar conta e aceitar convite" : "Aceitar convite"}</button>
    {props.createAccount && <><div className="auth-divider"><span>ou</span></div><button className="social-button" type="button" onClick={continueWithGoogle} disabled={!props.googleEnabled || loading}><span className="google-mark">G</span>{props.googleEnabled ? "Continuar com Google" : "Google disponível em breve"}</button></>}
  </form>;
}
