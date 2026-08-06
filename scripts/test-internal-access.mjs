import { neon } from "@neondatabase/serverless";

if (process.env.ALLOW_INTERNAL_ACCESS_TESTS !== "true") throw new Error("Defina ALLOW_INTERNAL_ACCESS_TESTS=true para executar este teste temporário.");
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL não configurada.");

const baseURL = process.env.TEST_BASE_URL ?? "http://localhost:3001";
const sql = neon(process.env.DATABASE_URL);
const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const adminEmail = `teste-admin-${suffix}@bora.local`;
const staffEmail = `teste-staff-${suffix}@bora.local`;
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
  await requireStatus(await request("/api/onboarding", { jar: adminJar, body: { role: "CLIENT", whatsappName: "Admin Teste", whatsappNumber: "85999990000", acceptedTerms: true, acceptsOperationalMessages: true, acceptsMarketing: false } }), 200, "perfil do administrador");

  const [admin] = await sql.query("SELECT id FROM users WHERE email = $1", [adminEmail]);
  await sql.query("INSERT INTO user_roles (user_id, role) VALUES ($1, 'ADMIN') ON CONFLICT DO NOTHING", [admin.id]);
  const adminPage = await request("/admin/usuarios", { jar: adminJar, method: "GET", redirect: "manual" });
  await requireStatus(adminPage, 200, "painel do administrador");

  const invitationResponse = await requireStatus(await request("/api/admin/invitations", { jar: adminJar, body: { name: "Colaborador Temporário", email: staffEmail, role: "STAFF", whatsappName: "Staff Teste", whatsappNumber: "85999990001" } }), 200, "convite do colaborador");
  const invitation = await invitationResponse.json();
  const token = new URL(invitation.inviteUrl).pathname.split("/").pop();

  const staffJar = new CookieJar();
  await requireStatus(await request("/api/auth/sign-up/email", { jar: staffJar, body: { name: "Colaborador Temporário", email: staffEmail, password } }), 200, "cadastro do colaborador");
  await requireStatus(await request("/api/invitations/accept", { jar: staffJar, body: { token, whatsappName: "Staff Teste", whatsappNumber: "85999990001", acceptedTerms: true } }), 200, "aceitação do convite");
  const [staff] = await sql.query("SELECT id FROM users WHERE email = $1", [staffEmail]);
  const roles = await sql.query("SELECT role FROM user_roles WHERE user_id = $1 ORDER BY role", [staff.id]);
  if (!roles.some(({ role }) => role === "STAFF")) throw new Error("O papel STAFF não foi concedido.");

  await requireStatus(await request("/api/admin/invitations", { jar: staffJar, body: { name: "Inválido", email: `invalido-${suffix}@bora.local`, role: "STAFF" } }), 403, "restrição administrativa do colaborador");
  const staffAdminPage = await request("/admin/usuarios", { jar: staffJar, method: "GET", redirect: "manual" });
  if (![302, 303, 307, 308].includes(staffAdminPage.status) || staffAdminPage.headers.get("location") !== "/painel") throw new Error("O colaborador não foi redirecionado para fora do painel administrativo.");

  await requireStatus(await request(`/api/admin/users/${staff.id}`, { jar: adminJar, method: "PATCH", body: { status: "SUSPENDED" } }), 200, "suspensão do colaborador");
  const [suspended] = await sql.query("SELECT status FROM user_profiles WHERE user_id = $1", [staff.id]);
  if (suspended.status !== "SUSPENDED") throw new Error("A suspensão não foi persistida.");
  const sessions = await sql.query("SELECT id FROM sessions WHERE user_id = $1", [staff.id]);
  if (sessions.length) throw new Error("A sessão do colaborador suspenso permaneceu ativa.");
  await requireStatus(await request(`/api/admin/users/${staff.id}`, { jar: adminJar, method: "PATCH", body: { status: "ACTIVE" } }), 200, "reativação do colaborador");

  console.log("Fluxo interno validado: privilégios públicos bloqueados, convite aceito, STAFF restrito e suspensão com encerramento de sessão.");
} finally {
  await sql.query("DELETE FROM audit_logs WHERE actor_user_id IN (SELECT id FROM users WHERE email IN ($1, $2)) OR target_user_id IN (SELECT id FROM users WHERE email IN ($1, $2))", [adminEmail, staffEmail]);
  await sql.query("DELETE FROM internal_invitations WHERE email IN ($1, $2) OR invited_by IN (SELECT id FROM users WHERE email IN ($1, $2))", [adminEmail, staffEmail]);
  await sql.query("DELETE FROM users WHERE email IN ($1, $2)", [adminEmail, staffEmail]);
}
