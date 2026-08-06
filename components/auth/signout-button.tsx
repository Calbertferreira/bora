"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export function SignoutButton() {
  const [loading, setLoading] = useState(false);
  return <button className="secondary-button" disabled={loading} onClick={async () => {
    setLoading(true);
    await authClient.signOut();
    window.location.href = "/";
  }}>{loading ? "Saindo..." : "Sair"}</button>;
}
