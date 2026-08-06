import { SignoutButton } from "@/components/auth/signout-button";
import { requirePageRole } from "@/lib/access";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const access = await requirePageRole(["ADMIN"]);
  return <div className="admin-page">
    <header className="dashboard-nav">
      <a className="brand" href="/">bora<span>.</span></a>
      <nav className="admin-nav-links"><a href="/painel">Meu painel</a><a href="/admin/usuarios">Usuários</a></nav>
      <div><span>{access.session.user.email}</span><SignoutButton /></div>
    </header>
    {children}
  </div>;
}
