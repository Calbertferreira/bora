import { redirect } from "next/navigation";
import { SignoutButton } from "@/components/auth/signout-button";
import { getCurrentAccess, isAccessBlocked } from "@/lib/access";

const statusNames: Record<string, string> = { SUSPENDED: "suspensa", BLOCKED: "bloqueada", REJECTED: "rejeitada", INACTIVE: "inativa" };

export default async function BlockedAccessPage() {
  const access = await getCurrentAccess();
  if (!access) redirect("/entrar");
  if (!access.profile) redirect("/onboarding");
  if (!isAccessBlocked(access.profile.status)) redirect("/painel");
  return <main className="auth-page"><a className="brand auth-brand" href="/">bora<span>.</span></a><section className="auth-card compact"><div className="auth-heading"><span>ACESSO INTERROMPIDO</span><h1>Conta {statusNames[access.profile.status] ?? "indisponível"}</h1><p>Seu acesso não está liberado neste momento. Fale com um administrador do BORA para revisar a situação.</p></div><SignoutButton /></section></main>;
}
