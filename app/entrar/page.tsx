import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { auth, isGoogleAuthEnabled } from "@/lib/auth";

export default async function LoginPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session) redirect("/painel");
  return <main className="auth-page">
    <a className="brand auth-brand" href="/">bora<span>.</span></a>
    <section className="auth-card compact">
      <div className="auth-heading"><span>BEM-VINDO DE VOLTA</span><h1>Entre na sua conta</h1><p>Acesse seus planejamentos, serviços e oportunidades.</p></div>
      <LoginForm googleEnabled={isGoogleAuthEnabled} />
    </section>
  </main>;
}
