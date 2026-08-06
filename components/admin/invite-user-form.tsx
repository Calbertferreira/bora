"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type InviteResult = { inviteUrl: string; expiresAt: string; whatsappNumber: string | null };

export function InviteUserForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<InviteResult | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setResult(null);
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const response = await fetch("/api/admin/invitations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        email: form.get("email"),
        role: form.get("role"),
        whatsappName: form.get("whatsappName") || undefined,
        whatsappNumber: form.get("whatsappNumber") || undefined,
      }),
    });
    const payload = await response.json();
    if (!response.ok) {
      setMessage(payload.error ?? "Não foi possível criar o convite.");
      setLoading(false);
      return;
    }
    setResult(payload);
    formElement.reset();
    setLoading(false);
    router.refresh();
  }

  async function copyLink() {
    if (!result) return;
    await navigator.clipboard.writeText(result.inviteUrl);
    setMessage("Link copiado.");
  }

  const whatsappTarget = result?.whatsappNumber?.replace(/\D/g, "") ?? "";

  return <article className="invite-card">
    <span>NOVO ACESSO INTERNO</span><h2>Convidar pessoa</h2><p>O convite será válido por 72 horas e funcionará somente para o e-mail informado.</p>
    <form className="admin-form" onSubmit={submit}>
      <label>Nome completo<input name="name" required minLength={2} /></label>
      <label>E-mail<input name="email" type="email" required /></label>
      <label>Papel<select name="role" defaultValue="STAFF"><option value="STAFF">Colaborador</option><option value="ADMIN">Administrador</option></select></label>
      <label>Nome no WhatsApp <small>(opcional)</small><input name="whatsappName" /></label>
      <label className="full">Número do WhatsApp <small>(opcional)</small><input name="whatsappNumber" type="tel" placeholder="(85) 99999-9999" /></label>
      <button className="primary-button full" disabled={loading}>{loading ? "Criando convite..." : "Gerar convite"}</button>
    </form>
    {message && <p className={message === "Link copiado." ? "form-message success" : "form-message error"}>{message}</p>}
    {result && <div className="invite-result"><strong>Convite criado</strong><p>Envie este link diretamente à pessoa convidada:</p><code>{result.inviteUrl}</code><div><button className="secondary-button" type="button" onClick={copyLink}>Copiar link</button><a className="secondary-button" target="_blank" rel="noreferrer" href={`https://wa.me/${whatsappTarget}?text=${encodeURIComponent(`Você foi convidado para a equipe BORA. Aceite o convite: ${result.inviteUrl}`)}`}>Enviar no WhatsApp</a></div></div>}
  </article>;
}
