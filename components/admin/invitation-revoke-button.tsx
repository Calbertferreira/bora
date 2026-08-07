"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function InvitationRevokeButton({ invitationId }: { invitationId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function revoke() {
    if (!window.confirm("Revogar este convite? O link deixará de funcionar imediatamente.")) return;
    setLoading(true);
    setMessage("");
    const response = await fetch(`/api/admin/invitations/${invitationId}`, { method: "DELETE" });
    const payload = await response.json();
    if (!response.ok) setMessage(payload.error ?? "Falha ao revogar.");
    else router.refresh();
    setLoading(false);
  }

  return <div className="status-actions"><button className="danger" disabled={loading} onClick={revoke}>{loading ? "Revogando..." : "Revogar"}</button>{message && <small>{message}</small>}</div>;
}
