import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SignoutButton } from "@/components/auth/signout-button";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { supplierProfiles, userProfiles, userRoles } from "@/lib/db/schema";

const roleNames = { ADMIN: "Administrador", STAFF: "Usuário interno", SUPPLIER: "Fornecedor", CLIENT: "Cliente" } as const;

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/entrar");
  const db = getDb();
  const [profile] = await db.select().from(userProfiles).where(eq(userProfiles.userId, session.user.id)).limit(1);
  if (!profile) redirect("/onboarding");
  const roles = await db.select({ role: userRoles.role }).from(userRoles).where(eq(userRoles.userId, session.user.id));
  const supplier = roles.some(({ role }) => role === "SUPPLIER")
    ? (await db.select().from(supplierProfiles).where(eq(supplierProfiles.userId, session.user.id)).limit(1))[0]
    : undefined;

  return <main className="dashboard-page">
    <header className="dashboard-nav"><a className="brand" href="/">bora<span>.</span></a><div><span>{session.user.email}</span><SignoutButton /></div></header>
    <section className="dashboard-shell">
      <div className="welcome-card"><div><span>MINHA CONTA</span><h1>Olá, {session.user.name.split(" ")[0]}!</h1><p>Seu espaço no BORA já está pronto.</p></div><div className="role-badges">{roles.map(({ role }) => <b key={role}>{roleNames[role]}</b>)}</div></div>
      {supplier?.approvalStatus === "UNDER_REVIEW" && <div className="status-card review"><strong>Cadastro de fornecedor em análise</strong><p>Seus dados foram recebidos. Assim que forem aprovados, você poderá publicar serviços e preços.</p></div>}
      <div className="dashboard-grid">
        <article><span>WhatsApp</span><h2>{profile.whatsappName}</h2><p>{profile.whatsappNumber}</p></article>
        {roles.some(({ role }) => role === "CLIENT") && <article><span>Planejamentos</span><h2>Comece seu momento</h2><p>Crie uma festa ou uma experiência de descanso.</p><a href="/">Planejar agora →</a></article>}
        {roles.some(({ role }) => role === "SUPPLIER") && <article><span>Área do fornecedor</span><h2>{supplier?.businessName}</h2><p>{supplier?.serviceCategory}</p><small>A publicação será liberada após a aprovação.</small></article>}
      </div>
    </section>
  </main>;
}
