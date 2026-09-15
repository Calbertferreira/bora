"use client";

import { upload } from "@vercel/blob/client";
import { useState } from "react";

export function ContractTemplateUpload({ userId, currentName }: { userId: string; currentName: string | null }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function select(file?: File) {
    if (!file) return;
    if (file.type !== "application/pdf" || file.size > 10 * 1024 * 1024) return setMessage("Escolha um PDF de até 10 MB.");
    setBusy(true); setMessage("");
    try {
      const safe = file.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9._-]/g, "-");
      const blob = await upload(`suppliers/${userId}/contracts/${Date.now()}-${safe}`, file, { access: "private", handleUploadUrl: "/api/supplier/uploads" });
      const response = await fetch("/api/supplier/contract-template", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ url: blob.url, pathname: blob.pathname, name: file.name }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      setMessage("Modelo de contrato salvo.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Não foi possível enviar o PDF."); }
    finally { setBusy(false); }
  }

  return <section className="contract-upload-card"><span>CONTRATO PADRÃO</span><h2>Modelo em PDF</h2><p>O BORA usará os dados do cliente, do evento e da grade financeira para gerar o contrato preenchido. O PDF ficará guardado como modelo do fornecedor.</p>{currentName && <strong>Modelo atual: {currentName}</strong>}<label>{busy ? "Enviando..." : currentName ? "Substituir PDF" : "Anexar PDF"}<input type="file" accept="application/pdf" disabled={busy} onChange={(event) => select(event.target.files?.[0])} /></label>{message && <small>{message}</small>}</section>;
}
