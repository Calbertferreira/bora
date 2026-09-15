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
        {(roles.includes("ADMIN") || roles.includes("STAFF")) && <article><span>Operação</span><h2>Planejamentos dos clientes</h2><p>Analise solicitações e atualize o andamento de cada experiência.</p><a href="/admin/planejamentos">Abrir fila operacional →</a></article>}
        {roles.includes("CLIENT") && <><article><span>Planejamentos</span><h2>Meus momentos</h2><p>Crie uma experiência ou acompanhe as solicitações existentes.</p><a href="/cliente/planejamentos">Acompanhar planejamentos →</a></article><article><span>Contratos e propostas</span><h2>Meus pacotes</h2><p>Veja grades de serviços, valores e contratos enviados pelos fornecedores.</p><a href="/cliente/pacotes">Abrir meus pacotes →</a></article></>}
        {roles.includes("SUPPLIER") && <article><span>Área do fornecedor</span><h2>{supplier?.businessName}</h2><p>{supplier?.serviceCategory}</p>{supplier?.approvalStatus === "ACTIVE" ? <><a href="/fornecedor/catalogo">Gerenciar catálogo →</a><a href="/fornecedor/pacotes">Montar pacotes e contratos →</a></> : <small>A publicação será liberada após a aprovação.</small>}</article>}
      </div>
    </section>
  </main>;
}
