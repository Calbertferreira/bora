"use client";

import { useState } from "react";

export function ProposalSelectButton({ planId, proposalId }: { planId: string; proposalId: string }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  async function select() {
    setLoading(true);
    const response = await fetch(`/api/plans/${planId}/proposals/${proposalId}/select`, { method: "POST" });
    const body = await response.json();
    if (!response.ok) { setLoading(false); return setMessage(body.error ?? "Não foi possível escolher."); }
    window.location.reload();
  }
  return <div className="proposal-select"><button onClick={select} disabled={loading}>{loading ? "Confirmando..." : "Escolher esta proposta"}</button>{message && <small>{message}</small>}</div>;
}
