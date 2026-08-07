import { neon } from "@neondatabase/serverless";

if (process.env.ALLOW_INTERNAL_ACCESS_TESTS !== "true") throw new Error("Defina ALLOW_INTERNAL_ACCESS_TESTS=true para executar este teste temporário.");
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL não configurada.");

const baseURL = process.env.TEST_BASE_URL ?? "http://localhost:3001";
const sql = neon(process.env.DATABASE_URL);
const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const adminEmail = `teste-admin-${suffix}@bora.local`;
const staffEmail = `teste-staff-${suffix}@bora.local`;
const supplierEmail = `teste-supplier-${suffix}@bora.local`;
const revokedEmail = `teste-revoked-${suffix}@bora.local`;
const password = `Bora-${suffix}-A1!`;

class CookieJar {
  cookies = new Map();
  update(headers) {
    const values = typeof headers.getSetCookie === "function" ? headers.getSetCookie() : [headers.get("set-cookie")].filter(Boolean);
    for (const value of values) {
      const pair = value.split(";", 1)[0];
      const separator = pair.indexOf("=");
      if (separator > 0) this.cookies.set(pair.slice(0, separator), pair.slice(separator + 1));
    }
  }
  value() { return [...this.cookies].map(([name, value]) => `${name}=${value}`).join("; "); }
}

async function request(path, { jar, body, method = "POST", redirect = "follow" } = {}) {
  const headers = { origin: baseURL };
  if (body !== undefined) headers["content-type"] = "application/json";
  if (jar?.value()) headers.cookie = jar.value();
  const response = await fetch(`${baseURL}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body), redirect });
  jar?.update(response.headers);
  return response;
}

async function requireStatus(response, expected, label) {
  if (response.status !== expected) {
    const text = await response.text();
    throw new Error(`${label}: esperado ${expected}, recebido ${response.status}: ${text.slice(0, 300)}`);
  }
  return response;
}

try {
  const adminJar = new CookieJar();
  await requireStatus(await request("/api/auth/sign-up/email", { jar: adminJar, body: { name: "Administrador Temporário", email: adminEmail, password } }), 200, "cadastro do administrador");
  await requireStatus(await request("/api/onboarding", { jar: adminJar, body: { role: "ADMIN", whatsappName: "Admin Teste", whatsappNumber: "85999990000", acceptedTerms: true } }), 400, "bloqueio de papel público privilegiado");
  await requireStatus(await request("/api/onboarding", { jar: adminJar, body: { role: "CLIENT", whatsappName: "Admin Teste", whatsappNumber: "123", acceptedTerms: true } }), 400, "validação do WhatsApp");
  await requireStatus(await request("/api/onboarding", { jar: adminJar, body: { role: "CLIENT", whatsappName: "Admin Teste", whatsappNumber: "85999990000", acceptedTerms: true, acceptsOperationalMessages: true, acceptsMarketing: false } }), 200, "perfil do administrador");

  const [admin] = await sql.query("SELECT id FROM users WHERE email = $1", [adminEmail]);
  await sql.query("INSERT INTO user_roles (user_id, role) VALUES ($1, 'ADMIN') ON CONFLICT DO NOTHING", [admin.id]);
  await requireStatus(await request("/admin/usuarios", { jar: adminJar, method: "GET", redirect: "manual" }), 200, "painel do administrador");

  const invitationResponse = await requireStatus(await request("/api/admin/invitations", { jar: adminJar, body: { name: "Colaborador Temporário", email: staffEmail, role: "STAFF", whatsappName: "Staff Teste", whatsappNumber: "85999990001" } }), 200, "convite do colaborador");
  const invitation = await invitationResponse.json();
  const token = new URL(invitation.inviteUrl).pathname.split("/").pop();

  const revokedResponse = await requireStatus(await request("/api/admin/invitations", { jar: adminJar, body: { name: "Convite Revogado", email: revokedEmail, role: "STAFF", whatsappName: "Revogado", whatsappNumber: "85999990003" } }), 200, "convite a revogar");
  const revokedInvitation = await revokedResponse.json();
  await requireStatus(await request(`/api/admin/invitations/${revokedInvitation.invitationId}`, { jar: adminJar, method: "DELETE" }), 200, "revogação do convite");
  const [revoked] = await sql.query("SELECT status FROM internal_invitations WHERE id = $1", [revokedInvitation.invitationId]);
  if (revoked.status !== "REVOKED") throw new Error("A revogação do convite não foi persistida.");

  const staffJar = new CookieJar();
  await requireStatus(await request("/api/auth/sign-up/email", { jar: staffJar, body: { name: "Colaborador Temporário", email: staffEmail, password } }), 200, "cadastro do colaborador");
  await requireStatus(await request("/api/invitations/accept", { jar: staffJar, body: { token, whatsappName: "Staff Teste", whatsappNumber: "85999990001", acceptedTerms: true } }), 200, "aceitação do convite");
  const [staff] = await sql.query("SELECT id FROM users WHERE email = $1", [staffEmail]);
  const roles = await sql.query("SELECT role FROM user_roles WHERE user_id = $1 ORDER BY role", [staff.id]);
  if (!roles.some(({ role }) => role === "STAFF")) throw new Error("O papel STAFF não foi concedido.");

  await requireStatus(await request("/api/admin/invitations", { jar: staffJar, body: { name: "Inválido", email: `invalido-${suffix}@bora.local`, role: "STAFF" } }), 403, "restrição administrativa do colaborador");
  const staffAdminPage = await request("/admin/usuarios", { jar: staffJar, method: "GET", redirect: "manual" });
  if (![302, 303, 307, 308].includes(staffAdminPage.status) || staffAdminPage.headers.get("location") !== "/painel") throw new Error("O colaborador não foi redirecionado para fora do painel administrativo.");

  const supplierJar = new CookieJar();
  await requireStatus(await request("/api/auth/sign-up/email", { jar: supplierJar, body: { name: "Fornecedor Temporário", email: supplierEmail, password } }), 200, "cadastro do fornecedor");
  await requireStatus(await request("/api/onboarding", { jar: supplierJar, body: { role: "SUPPLIER", whatsappName: "Fornecedor Teste", whatsappNumber: "85999990002", acceptedTerms: true, acceptsOperationalMessages: true, acceptsMarketing: false, businessName: "Buffet Temporário", serviceCategory: "Buffet" } }), 200, "perfil do fornecedor");
  const [supplier] = await sql.query("SELECT id FROM users WHERE email = $1", [supplierEmail]);
  await requireStatus(await request(`/api/admin/suppliers/${supplier.id}`, { jar: adminJar, method: "PATCH", body: { approvalStatus: "ACTIVE" } }), 200, "aprovação do fornecedor");
  const [approved] = await sql.query("SELECT approval_status FROM supplier_profiles WHERE user_id = $1", [supplier.id]);
  if (approved.approval_status !== "ACTIVE") throw new Error("A aprovação do fornecedor não foi persistida.");
  await requireStatus(await request(`/api/admin/suppliers/${supplier.id}`, { jar: adminJar, method: "PATCH", body: { approvalStatus: "REJECTED" } }), 200, "rejeição do fornecedor");

  await requireStatus(await request(`/api/admin/users/${staff.id}`, { jar: adminJar, method: "PATCH", body: { status: "SUSPENDED" } }), 200, "suspensão do colaborador");
  const [suspended] = await sql.query("SELECT status FROM user_profiles WHERE user_id = $1", [staff.id]);
  if (suspended.status !== "SUSPENDED") throw new Error("A suspensão não foi persistida.");
  const sessions = await sql.query("SELECT id FROM sessions WHERE user_id = $1", [staff.id]);
  if (sessions.length) throw new Error("A sessão do colaborador suspenso permaneceu ativa.");
  await requireStatus(await request(`/api/admin/users/${staff.id}`, { jar: adminJar, method: "PATCH", body: { status: "ACTIVE" } }), 200, "reativação do colaborador");

  console.log("Fluxo validado: cadastros, WhatsApp, convites, revogação, STAFF restrito, fornecedor aprovado/rejeitado e suspensão de conta.");
} finally {
  await sql.query("DELETE FROM audit_logs WHERE actor_user_id IN (SELECT id FROM users WHERE email IN ($1, $2, $3)) OR target_user_id IN (SELECT id FROM users WHERE email IN ($1, $2, $3))", [adminEmail, staffEmail, supplierEmail]);
  await sql.query("DELETE FROM internal_invitations WHERE email IN ($1, $2, $3, $4) OR invited_by IN (SELECT id FROM users WHERE email IN ($1, $2, $3))", [adminEmail, staffEmail, supplierEmail, revokedEmail]);
  await sql.query("DELETE FROM users WHERE email IN ($1, $2, $3)", [adminEmail, staffEmail, supplierEmail]);
}
