import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL não configurada.");
const baseURL = process.env.TEST_BASE_URL ?? "http://127.0.0.1:3001";
const sql = neon(process.env.DATABASE_URL);
const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
const email = `teste-planejamento-${suffix}@bora.local`;
const password = `Bora-${suffix}-A1!`;

class CookieJar {
  cookies = new Map();
  update(headers) {
    const values = typeof headers.getSetCookie === "function" ? headers.getSetCookie() : [headers.get("set-cookie")].filter(Boolean);
    for (const value of values) { const pair = value.split(";", 1)[0]; const separator = pair.indexOf("="); if (separator > 0) this.cookies.set(pair.slice(0, separator), pair.slice(separator + 1)); }
  }
  value() { return [...this.cookies].map(([name, value]) => `${name}=${value}`).join("; "); }
}

async function request(path, { jar, body, method = "POST", redirect = "follow" } = {}) {
  const headers = { origin: baseURL };
  if (body !== undefined) headers["content-type"] = "application/json";
  if (jar?.value()) headers.cookie = jar.value();
  const response = await fetch(`${baseURL}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body), redirect });
  jar?.update(response.headers); return response;
}
async function expectStatus(response, expected, label) {
  if (response.status !== expected) throw new Error(`${label}: esperado ${expected}, recebido ${response.status}: ${(await response.text()).slice(0, 300)}`);
  return response;
}

let userId;
try {
  await expectStatus(await request("/api/plans", { body: {} }), 401, "proteção do cadastro de planejamento");
  const jar = new CookieJar();
  await expectStatus(await request("/api/auth/sign-up/email", { jar, body: { name: "Cliente Planejamento", email, password } }), 200, "cadastro do cliente");
  await expectStatus(await request("/api/onboarding", { jar, body: { role: "CLIENT", whatsappName: "Cliente Teste", whatsappNumber: "85999998888", acceptedTerms: true, acceptsOperationalMessages: true, acceptsMarketing: false } }), 200, "onboarding do cliente");
  const [user] = await sql.query("select id from users where email = $1", [email]); userId = user.id;
  const createdResponse = await expectStatus(await request("/api/plans", { jar, body: { type: "celebrate", occasion: "Aniversário adulto", city: "Fortaleza", state: "CE", startDate: "2026-12-10", endDate: "2026-12-10", guests: 80, budgetLabel: "R$ 8 mil a R$ 15 mil", services: ["Local", "Buffet", "Decoração"] } }), 201, "criação do planejamento");
  const { planId } = await createdResponse.json();
  const [saved] = await sql.query("select status, city, guests from plans where id = $1 and user_id = $2", [planId, userId]);
  if (!saved || saved.status !== "SUBMITTED" || saved.city !== "Fortaleza" || saved.guests !== 80) throw new Error("Os dados principais não foram persistidos.");
  const services = await sql.query("select name from plan_services where plan_id = $1", [planId]);
  if (services.length !== 3) throw new Error("Os serviços solicitados não foram persistidos.");
  const listPage = await expectStatus(await request("/cliente/planejamentos", { jar, method: "GET" }), 200, "lista do cliente");
  if (!(await listPage.text()).includes("Aniversário adulto")) throw new Error("O planejamento não apareceu na lista do cliente.");
  await sql.query("insert into user_roles (user_id, role) values ($1, 'ADMIN') on conflict do nothing", [userId]);
  await expectStatus(await request(`/api/admin/plans/${planId}`, { jar, method: "PATCH", body: { status: "IN_REVIEW", note: "Estamos selecionando fornecedores compatíveis." } }), 200, "atualização operacional");
  const detailPage = await expectStatus(await request(`/cliente/planejamentos/${planId}`, { jar, method: "GET" }), 200, "detalhe do cliente");
  const detailHtml = await detailPage.text();
  if (!detailHtml.includes("Estamos selecionando fornecedores compatíveis") || !detailHtml.includes("Em análise")) throw new Error("O histórico atualizado não apareceu para o cliente.");
  await expectStatus(await request("/admin/planejamentos", { jar, method: "GET" }), 200, "fila operacional");
  console.log("Fluxo validado: cliente cria, consulta e acompanha; equipe atualiza o andamento e a observação aparece no histórico.");
} finally {
  if (userId) { await sql.query("delete from audit_logs where actor_user_id = $1 or target_user_id = $1", [userId]); await sql.query("delete from plans where user_id = $1", [userId]); await sql.query("delete from users where id = $1", [userId]); }
}
