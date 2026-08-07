import { desc, eq } from "drizzle-orm";
import { InviteUserForm } from "@/components/admin/invite-user-form";
import { InvitationRevokeButton } from "@/components/admin/invitation-revoke-button";
import { SupplierApprovalControl } from "@/components/admin/supplier-approval-control";
import { UserStatusControl } from "@/components/admin/user-status-control";
import { requirePageRole } from "@/lib/access";
import { getDb } from "@/lib/db";
import { internalInvitations, supplierProfiles, userProfiles, userRoles, users } from "@/lib/db/schema";

const roleNames = { ADMIN: "Administrador", STAFF: "Colaborador", SUPPLIER: "Fornecedor", CLIENT: "Cliente" } as const;
const statusNames: Record<string, string> = {
  PENDING: "Pendente", UNDER_REVIEW: "Em análise", ACTIVE: "Ativo", SUSPENDED: "Suspenso",
  BLOCKED: "Bloqueado", REJECTED: "Rejeitado", INACTIVE: "Inativo",
};
const invitationNames = { PENDING: "Pendente", ACCEPTED: "Aceito", REVOKED: "Revogado", EXPIRED: "Expirado" } as const;
const approvalNames = { ACTIVE: "Aprovado", REJECTED: "Rejeitado", UNDER_REVIEW: "Em análise" } as const;

type Role = keyof typeof roleNames;
type SupplierApprovalStatus = keyof typeof approvalNames;

function toSupplierApprovalStatus(value: string | null): SupplierApprovalStatus | null {
  return value === "ACTIVE" || value === "REJECTED" || value === "UNDER_REVIEW" ? value : null;
}

type ListedUser = {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  whatsappName: string | null;
  whatsappNumber: string | null;
  status: string | null;
  businessName: string | null;
  serviceCategory: string | null;
  supplierApprovalStatus: SupplierApprovalStatus | null;
  roles: Role[];
};

export default async function AdminUsersPage() {
  const access = await requirePageRole(["ADMIN"]);
  const db = getDb();
  const rows = await db.select({
    id: users.id,
    name: users.name,
    email: users.email,
    createdAt: users.createdAt,
    whatsappName: userProfiles.whatsappName,
    whatsappNumber: userProfiles.whatsappNumber,
    status: userProfiles.status,
    businessName: supplierProfiles.businessName,
    serviceCategory: supplierProfiles.serviceCategory,
    supplierApprovalStatus: supplierProfiles.approvalStatus,
    role: userRoles.role,
  }).from(users)
    .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
    .leftJoin(supplierProfiles, eq(supplierProfiles.userId, users.id))
    .leftJoin(userRoles, eq(userRoles.userId, users.id))
    .orderBy(desc(users.createdAt));

  const grouped = new Map<string, ListedUser>();
  for (const row of rows) {
    const item = grouped.get(row.id) ?? {
      id: row.id,
      name: row.name,
      email: row.email,
      createdAt: row.createdAt,
      whatsappName: row.whatsappName,
      whatsappNumber: row.whatsappNumber,
      status: row.status,
      businessName: row.businessName,
      serviceCategory: row.serviceCategory,
      supplierApprovalStatus: toSupplierApprovalStatus(row.supplierApprovalStatus),
      roles: [] as Role[],
    };
    if (row.role && !item.roles.includes(row.role)) item.roles.push(row.role);
    grouped.set(row.id, item);
  }

  const invitations = await db.select().from(internalInvitations).orderBy(desc(internalInvitations.createdAt)).limit(30);

  return <main className="admin-shell">
    <div className="admin-heading">
      <div><span>CONTROLE DE ACESSO</span><h1>Usuários e convites</h1><p>Cadastre a equipe interna sem expor papéis privilegiados no cadastro público.</p></div>
      <b>{grouped.size} contas</b>
    </div>
    <section className="admin-grid">
      <InviteUserForm />
      <article className="admin-info-card"><span>POLÍTICA DE ACESSO</span><h2>Privilégios protegidos</h2><p>Administradores e colaboradores entram somente por convite vinculado ao e-mail. O link expira em 72 horas.</p><ul><li>Administrador: acesso total.</li><li>Colaborador: operação sem resultados financeiros.</li><li>Fornecedor e cliente: cadastro público.</li></ul></article>
    </section>
    <section className="admin-table-card">
      <div className="section-title"><div><span>CONTAS</span><h2>Usuários cadastrados</h2></div></div>
      <div className="table-scroll"><table className="admin-table"><thead><tr><th>Pessoa</th><th>WhatsApp</th><th>Papéis</th><th>Fornecedor</th><th>Status da conta</th><th>Ação</th></tr></thead><tbody>
        {[...grouped.values()].map((user) => <tr key={user.id}>
          <td><strong>{user.name}</strong><small>{user.email}</small></td>
          <td>{user.whatsappName ? <><strong>{user.whatsappName}</strong><small>{user.whatsappNumber}</small></> : <span className="muted">Não informado</span>}</td>
          <td><div className="compact-badges">{user.roles.map((role) => <b key={role}>{roleNames[role]}</b>)}</div></td>
          <td>{user.supplierApprovalStatus ? <div className="supplier-approval"><strong>{user.businessName}</strong><small>{user.serviceCategory}</small><span className={`account-status status-${user.supplierApprovalStatus.toLowerCase()}`}>{approvalNames[user.supplierApprovalStatus]}</span><SupplierApprovalControl userId={user.id} currentStatus={user.supplierApprovalStatus} /></div> : <span className="muted">Não se aplica</span>}</td>
          <td><span className={`account-status status-${(user.status ?? "PENDING").toLowerCase()}`}>{statusNames[user.status ?? "PENDING"]}</span></td>
          <td><UserStatusControl userId={user.id} currentStatus={user.status ?? "PENDING"} ownAccount={user.id === access.session.user.id} /></td>
        </tr>)}
      </tbody></table></div>
    </section>
    <section className="admin-table-card">
      <div className="section-title"><div><span>HISTÓRICO</span><h2>Convites recentes</h2></div></div>
      <div className="table-scroll"><table className="admin-table"><thead><tr><th>Pessoa</th><th>Papel</th><th>Status</th><th>Validade</th><th>Ação</th></tr></thead><tbody>
        {invitations.length ? invitations.map((invitation) => <tr key={invitation.id}>
          <td><strong>{invitation.name}</strong><small>{invitation.email}</small></td>
          <td>{roleNames[invitation.role]}</td><td>{invitationNames[invitation.status]}</td>
          <td>{invitation.expiresAt.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}</td>
          <td>{invitation.status === "PENDING" ? <InvitationRevokeButton invitationId={invitation.id} /> : <span className="muted">—</span>}</td>
        </tr>) : <tr><td colSpan={5} className="empty-cell">Nenhum convite emitido.</td></tr>}
      </tbody></table></div>
    </section>
  </main>;
}
