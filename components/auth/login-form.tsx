"use client";

import { FormEvent, useState } from "react";
import { authClient } from "@/lib/auth-client";

export function LoginForm({ googleEnabled }: { googleEnabled: boolean }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    const result = await authClient.signIn.email({
      email: String(form.get("email")),
      password: String(form.get("password")),
    });
    if (result.error) {
      setMessage("E-mail ou senha incorretos.");
      setLoading(false);
      return;
    }
    window.location.href = "/painel";
  }

  async function loginWithGoogle() {
    if (!googleEnabled) return;
    setLoading(true);
    await authClient.signIn.social({ provider: "google", callbackURL: "/painel" });
  }

  return <form className="auth-form" onSubmit={login}>
    <label>E-mail<input name="email" type="email" autoComplete="email" placeholder="voce@email.com" required /></label>
    <label>Senha<input name="password" type="password" autoComplete="current-password" placeholder="Sua senha" required /></label>
    {message && <p className="form-message error" role="alert">{message}</p>}
    <button className="primary-button" disabled={loading}>{loading ? "Entrando..." : "Entrar"}</button>
    <div className="auth-divider"><span>ou</span></div>
    <button className="social-button" type="button" onClick={loginWithGoogle} disabled={!googleEnabled || loading}>
      <span className="google-mark">G</span>
      {googleEnabled ? "Continuar com Google" : "Google disponível em breve"}
    </button>
    <p className="auth-switch">Ainda não tem conta? <a href="/cadastro">Cadastre-se</a></p>
  </form>;
}
