import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { InvitationAcceptForm } from "@/components/invitations/invitation-accept-form";
import { SignoutButton } from "@/components/auth/signout-button";
import { auth, isGoogleAuthEnabled } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { internalInvitations, userProfiles, users } from "@/lib/db/schema";
import { hashInvitationToken } from "@/lib/invitations";

const roleNames = { ADMIN: "Administrador", STAFF: "Colaborador", SUPPLIER: "Fornecedor", CLIENT: "Cliente" } as const;

function MessageCard({ title, children }: { title: string; children: React.ReactNode }) {
  return <main className="auth-page"><a className="brand auth-brand" href="/">bora<span>.</span></a><section className="auth-card compact"><div className="auth-heading"><span>ACESSO INTERNO</span><h1>{title}</h1><div>{children}</div></div></section></main>;
}

export default async function InvitationPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const db = getDb();
  const [invitation] = await db.select().from(internalInvitations).where(and(
    eq(internalInvitations.tokenHash, hashInvitationToken(token)),
    eq(internalInvitations.status, "PENDING"),
  )).limit(1);
  if (!invitation) return <MessageCard title="Convite indisponível"><p>Este link é inválido, foi revogado ou já foi utilizado.</p></MessageCard>;
  if (invitation.expiresAt.getTime() <= Date.now()) {
    await db.update(internalInvitations).set({ status: "EXPIRED", updatedAt: new Date() }).where(eq(internalInvitations.id, invitation.id));
    return <MessageCard title="Convite expirado"><p>Peça a um administrador para gerar um novo convite.</p></MessageCard>;
  }

  const session = await auth.api.getSession({ headers: await headers() });
  const [existingUser] = await db.select({ id: users.id }).from(users).where(eq(users.email, invitation.email.toLowerCase())).limit(1);
  if (!session && existingUser) {
    const returnPath = `/convite/${token}`;
    return <MessageCard title="Entre para aceitar"><p>Já existe uma conta com o e-mail <strong>{invitation.email}</strong>. Entre nela para confirmar o convite.</p><a className="primary-link-button" href={`/entrar?retorno=${encodeURIComponent(returnPath)}`}>Entrar na conta</a></MessageCard>;
  }
  if (session && session.user.email.toLowerCase() !== invitation.email.toLowerCase()) {
    return <MessageCard title="Conta diferente"><p>Este convite pertence a <strong>{invitation.email}</strong>, mas você está conectado como <strong>{session.user.email}</strong>.</p><p>Saia e entre com o e-mail convidado.</p><SignoutButton /></MessageCard>;
  }

  const [profile] = session
    ? await db.select().from(userProfiles).where(eq(userProfiles.userId, session.user.id)).limit(1)
    : [];
  const createAccount = !session;
  return <main className="auth-page">
    <a className="brand auth-brand" href="/">bora<span>.</span></a>
    <section className="auth-card wide">
      <div className="auth-heading"><span>CONVITE PARA A EQUIPE</span><h1>Bem-vindo ao BORA</h1><p>Confirme seus dados para ativar o acesso interno com segurança.</p></div>
      <InvitationAcceptForm
        token={token}
        email={invitation.email}
        name={invitation.name}
        roleName={roleNames[invitation.role]}
        createAccount={createAccount}
        needsTerms={!profile}
        googleEnabled={isGoogleAuthEnabled}
        defaultWhatsappName={profile?.whatsappName ?? invitation.whatsappName ?? invitation.name}
        defaultWhatsappNumber={profile?.whatsappNumber ?? invitation.whatsappNumber ?? ""}
      />
    </section>
  </main>;
}
