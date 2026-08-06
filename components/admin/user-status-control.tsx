"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function UserStatusControl({ userId, currentStatus, ownAccount }: { userId: string; currentStatus: string; ownAccount: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function changeStatus(status: "ACTIVE" | "SUSPENDED" | "BLOCKED") {
    setLoading(true);
    setMessage("");
    const response = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const payload = await response.json();
    if (!response.ok) setMessage(payload.error ?? "Falha ao atualizar.");
    else router.refresh();
    setLoading(false);
  }

  if (ownAccount) return <span className="muted">Conta atual</span>;
  return <div className="status-actions">
    {currentStatus === "ACTIVE" ? <>
      <button disabled={loading} onClick={() => changeStatus("SUSPENDED")}>Suspender</button>
      <button className="danger" disabled={loading} onClick={() => changeStatus("BLOCKED")}>Bloquear</button>
    </> : <button disabled={loading} onClick={() => changeStatus("ACTIVE")}>Reativar</button>}
    {message && <small>{message}</small>}
  </div>;
}
