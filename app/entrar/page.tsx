import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { auth, isGoogleAuthEnabled } from "@/lib/auth";

function safeReturnPath(value?: string) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/painel";
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ retorno?: string }> }) {
  const callbackURL = safeReturnPath((await searchParams).retorno);
  const session = await auth.api.getSession({ headers: await headers() });
  if (session) redirect(callbackURL);
  return <main className="auth-page">
    <a className="brand auth-brand" href="/">bora<span>.</span></a>
    <section className="auth-card compact">
      <div className="auth-heading"><span>BEM-VINDO DE VOLTA</span><h1>Entre na sua conta</h1><p>Acesse seus planejamentos, serviços e oportunidades.</p></div>
      <LoginForm googleEnabled={isGoogleAuthEnabled} callbackURL={callbackURL} />
    </section>
  </main>;
}
