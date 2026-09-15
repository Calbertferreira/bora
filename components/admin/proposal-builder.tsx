"use client";

import { useState } from "react";

type Offer = { id: string; name: string; businessName: string; priceLabel: string };

export function ProposalBuilder({ planId, offers }: { planId: string; offers: Offer[] }) {
  const [selected, setSelected] = useState<string[]>([]); const [saving, setSaving] = useState(false); const [message, setMessage] = useState("");
  function toggle(id: string) { setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]); }
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setMessage(""); const form = new FormData(event.currentTarget);
    const response = await fetch(`/api/admin/plans/${planId}/proposals`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ title: form.get("title"), description: form.get("description"), validUntil: form.get("validUntil"), listingIds: selected }) });
    const body = await response.json(); setSaving(false);
    if (!response.ok) return setMessage(body.error ?? "Não foi possível publicar.");
    window.location.href = "/admin/planejamentos";
  }
  return <form className="proposal-builder" onSubmit={submit}><label>Título da proposta<input name="title" required minLength={3} placeholder="Ex.: Pacote recomendado" /></label><label>Apresentação<textarea name="description" placeholder="Explique por que esta combinação atende ao cliente." /></label><label>Válida até<input name="validUntil" type="date" /></label><fieldset><legend>Selecione as ofertas</legend>{offers.length ? <div className="proposal-offers">{offers.map((offer) => <label className={selected.includes(offer.id) ? "selected" : ""} key={offer.id}><input type="checkbox" checked={selected.includes(offer.id)} onChange={() => toggle(offer.id)} /><span><strong>{offer.name}</strong><small>{offer.businessName} · {offer.priceLabel}</small></span></label>)}</div> : <p>Nenhuma oferta publicada está disponível.</p>}</fieldset>{message && <p className="form-message error">{message}</p>}<button disabled={saving || !selected.length}>{saving ? "Publicando..." : "Publicar para o cliente"}</button></form>;
}
