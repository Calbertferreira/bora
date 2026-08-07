import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { SignoutButton } from "@/components/auth/signout-button";
import { getCurrentAccess, isAccessBlocked } from "@/lib/access";
import { getDb } from "@/lib/db";
import { supplierProfiles } from "@/lib/db/schema";

const roleNames = { ADMIN: "Administrador", STAFF: "Colaborador", SUPPLIER: "Fornecedor", CLIENT: "Cliente" } as const;

export default async function DashboardPage() {
  const access = await getCurrentAccess();
  if (!access) redirect("/entrar");
  const { session, profile, roles } = access;
  if (!profile) redirect("/onboarding");
  if (isAccessBlocked(profile.status)) redirect("/acesso-bloqueado");
  const db = getDb();
  const supplier = roles.includes("SUPPLIER")
    ? (await db.select().from(supplierProfiles).where(eq(supplierProfiles.userId, session.user.id)).limit(1))[0]
    : undefined;

  return <main className="dashboard-page">
    <header className="dashboard-nav"><a className="brand" href="/">bora<span>.</span></a><div><span>{session.user.email}</span><SignoutButton /></div></header>
    <section className="dashboard-shell">
      <div className="welcome-card"><div><span>MINHA CONTA</span><h1>Olá, {session.user.name.split(" ")[0]}!</h1><p>Seu espaço no BORA já está pronto.</p></div><div className="role-badges">{roles.map((role) => <b key={role}>{roleNames[role]}</b>)}</div></div>
      {supplier?.approvalStatus === "UNDER_REVIEW" && <div className="status-card review"><strong>Cadastro de fornecedor em análise</strong><p>Seus dados foram recebidos. Assim que forem aprovados, você poderá publicar serviços e preços.</p></div>}
      {supplier?.approvalStatus === "ACTIVE" && <div className="status-card approved"><strong>Fornecedor aprovado</strong><p>Seu cadastro está liberado para a publicação de serviços e preços.</p></div>}
      {supplier?.approvalStatus === "REJECTED" && <div className="status-card rejected"><strong>Cadastro de fornecedor não aprovado</strong><p>Revise seus dados e procure a equipe BORA para solicitar uma nova análise.</p></div>}
      <div className="dashboard-grid">
        <article><span>WhatsApp</span><h2>{profile.whatsappName}</h2><p>{profile.whatsappNumber}</p></article>
        {roles.includes("ADMIN") && <article><span>Administração</span><h2>Usuários e acessos</h2><p>Convide colaboradores e administradores, suspenda contas e acompanhe os acessos.</p><a href="/admin/usuarios">Gerenciar usuários →</a></article>}
        {roles.includes("STAFF") && <article><span>Operação</span><h2>Área do colaborador</h2><p>Acesso operacional aos planejamentos e fornecedores, sem resultados financeiros.</p></article>}
        {roles.includes("CLIENT") && <article><span>Planejamentos</span><h2>Comece seu momento</h2><p>Crie uma festa ou uma experiência de descanso.</p><a href="/">Planejar agora →</a></article>}
        {roles.includes("SUPPLIER") && <article><span>Área do fornecedor</span><h2>{supplier?.businessName}</h2><p>{supplier?.serviceCategory}</p><small>A publicação será liberada após a aprovação.</small></article>}
      </div>
    </section>
  </main>;
}
