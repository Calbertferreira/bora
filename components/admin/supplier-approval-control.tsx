"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type ApprovalStatus = "ACTIVE" | "REJECTED" | "UNDER_REVIEW";

export function SupplierApprovalControl({ userId, currentStatus, administrationFeePercent }: { userId: string; currentStatus: ApprovalStatus; administrationFeePercent: number }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [fee, setFee] = useState(String(administrationFeePercent));

  async function changeStatus(approvalStatus: ApprovalStatus) {
    setLoading(true);
    setMessage("");
    const response = await fetch(`/api/admin/suppliers/${userId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ approvalStatus, administrationFeePercent: Number(fee) }),
    });
    const payload = await response.json();
    if (!response.ok) setMessage(payload.error ?? "Falha ao atualizar.");
    else router.refresh();
    setLoading(false);
  }

  return <div className="status-actions">
    <label className="supplier-fee">Taxa administrativa (%)<input type="number" min="0" max="100" step="0.01" value={fee} onChange={(event) => setFee(event.target.value)} /></label>
    {currentStatus !== "ACTIVE" && <button disabled={loading} onClick={() => changeStatus("ACTIVE")}>Aprovar</button>}
    {currentStatus !== "REJECTED" && <button className="danger" disabled={loading} onClick={() => changeStatus("REJECTED")}>Rejeitar</button>}
    {currentStatus !== "UNDER_REVIEW" && <button disabled={loading} onClick={() => changeStatus("UNDER_REVIEW")}>Reanalisar</button>}
    {message && <small>{message}</small>}
  </div>;
}
