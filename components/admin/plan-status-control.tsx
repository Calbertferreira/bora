"use client";

import { useState } from "react";
import { planStatusLabels, planStatuses, type PlanStatus } from "@/lib/plans";

export function PlanStatusControl({ planId, currentStatus }: { planId: string; currentStatus: PlanStatus }) {
  const [status, setStatus] = useState(currentStatus);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  async function save() {
    setSaving(true); setMessage("");
    const response = await fetch(`/api/admin/plans/${planId}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ status, note }) });
    const body = await response.json();
    setSaving(false);
    if (!response.ok) return setMessage(body.error ?? "Não foi possível atualizar.");
    setNote(""); setMessage("Andamento atualizado.");
  }
  return <div className="plan-status-control">
    <select value={status} onChange={(event) => setStatus(event.target.value as PlanStatus)}>{planStatuses.map((item) => <option key={item} value={item}>{planStatusLabels[item]}</option>)}</select>
    <input value={note} onChange={(event) => setNote(event.target.value)} placeholder="Observação para o cliente" />
    <button onClick={save} disabled={saving}>{saving ? "Salvando..." : "Atualizar"}</button>
    {message && <small>{message}</small>}
  </div>;
}
