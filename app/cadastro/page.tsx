import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SignupForm } from "@/components/auth/signup-form";
import { auth, isGoogleAuthEnabled } from "@/lib/auth";

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ perfil?: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session) redirect("/painel");
  const params = await searchParams;
  const initialRole = params.perfil === "fornecedor" ? "SUPPLIER" : "CLIENT";
  return <main className="auth-page">
    <a className="brand auth-brand" href="/">bora<span>.</span></a>
    <section className="auth-card wide">
      <div className="auth-heading"><span>COMECE AGORA</span><h1>Crie sua conta</h1><p>Escolha como você quer participar e complete seus dados.</p></div>
      <SignupForm googleEnabled={isGoogleAuthEnabled} initialRole={initialRole} />
    </section>
  </main>;
}
