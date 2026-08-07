"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ApprovalStatus = "ACTIVE" | "REJECTED" | "UNDER_REVIEW";

export function SupplierApprovalControl({ userId, currentStatus }: { userId: string; currentStatus: ApprovalStatus }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function changeStatus(approvalStatus: ApprovalStatus) {
    setLoading(true);
    setMessage("");
    const response = await fetch(`/api/admin/suppliers/${userId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ approvalStatus }),
    });
    const payload = await response.json();
    if (!response.ok) setMessage(payload.error ?? "Falha ao atualizar.");
    else router.refresh();
    setLoading(false);
  }

  return <div className="status-actions">
    {currentStatus !== "ACTIVE" && <button disabled={loading} onClick={() => changeStatus("ACTIVE")}>Aprovar</button>}
    {currentStatus !== "REJECTED" && <button className="danger" disabled={loading} onClick={() => changeStatus("REJECTED")}>Rejeitar</button>}
    {currentStatus !== "UNDER_REVIEW" && <button disabled={loading} onClick={() => changeStatus("UNDER_REVIEW")}>Reanalisar</button>}
    {message && <small>{message}</small>}
  </div>;
}
