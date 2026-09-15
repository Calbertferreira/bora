import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL não configurada.");
const baseURL = process.env.TEST_BASE_URL ?? "http://127.0.0.1:3001";
const sql = neon(process.env.DATABASE_URL);
const suffix = Date.now();
const digits = String(suffix).slice(-8);
const supplierPhone = `859${digits}`;
const clientPhone = `858${digits}`;
const supplierEmail = `teste-evento-fornecedor-${suffix}@bora.local`;
const clientEmail = `teste-evento-cliente-${suffix}@bora.local`;
const password = `Bora-${suffix}-A1!`;

class Jar {
  cookies = new Map();
  update(headers) {
    const values = typeof headers.getSetCookie === "function" ? headers.getSetCookie() : [headers.get("set-cookie")].filter(Boolean);
    for (const value of values) { const pair = value.split(";", 1)[0]; const index = pair.indexOf("="); if (index > 0) this.cookies.set(pair.slice(0, index), pair.slice(index + 1)); }
  }
  value() { return [...this.cookies].map(([key, value]) => `${key}=${value}`).join("; "); }
}

async function request(path, { jar, body, method = "POST" } = {}) {
  const headers = { origin: baseURL };
  if (body !== undefined) headers["content-type"] = "application/json";
  if (jar?.value()) headers.cookie = jar.value();
  const response = await fetch(`${baseURL}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  jar?.update(response.headers);
  return response;
}
async function expect(response, status, label) { if (response.status !== status) throw new Error(`${label}: ${response.status} ${(await response.text()).slice(0, 350)}`); return response; }

let supplierId;
let clientId;
let packageId;
let locationId;
try {
  const supplierJar = new Jar();
  await expect(await request("/api/auth/sign-up/email", { jar: supplierJar, body: { name: "Fornecedor Eventos", email: supplierEmail, password } }), 200, "cadastro fornecedor");
  await expect(await request("/api/onboarding", { jar: supplierJar, body: { role: "SUPPLIER", whatsappName: "Fornecedor", whatsappNumber: supplierPhone, acceptedTerms: true, businessName: "Organizador Teste", customServices: ["Organização de eventos"] } }), 200, "onboarding fornecedor");
  [{ id: supplierId }] = await sql.query("select id from users where email=$1", [supplierEmail]);
  await sql.query("insert into user_roles(user_id,role) values($1,'ADMIN') on conflict do nothing", [supplierId]);
  await expect(await request(`/api/admin/suppliers/${supplierId}`, { jar: supplierJar, method: "PATCH", body: { approvalStatus: "ACTIVE", administrationFeePercent: 12.5 } }), 200, "aprovação e taxa");

  const created = await expect(await request("/api/supplier/packages", { jar: supplierJar, body: { clientName: "Cliente Futuro", clientEmail, clientWhatsapp: clientPhone, locationName: "Espaço Temporário", locationAddress: `Rua de Teste ${suffix}, 100`, locationCity: "Fortaleza", locationState: "CE", eventType: "Casamento", eventTitle: "Casamento criado pelo fornecedor", eventDate: "2026-12-20", sendToClient: true, items: [{ serviceName: "Espaço", providerKind: "SELF", amountCents: 10000 }, { serviceName: "Decoração", providerKind: "MANUAL", providerName: "Decorador Livre", amountCents: 5000 }] } }), 201, "criação do evento");
  ({ packageId } = await created.json());
  let [saved] = await sql.query("select client_contact_id,client_user_id,event_location_id,origin,administration_fee_cents,total_cents,status from event_packages where id=$1", [packageId]);
  locationId = saved.event_location_id;
  if (!saved.client_contact_id || !locationId || saved.client_user_id || saved.origin !== "SUPPLIER" || saved.administration_fee_cents !== 2143 || saved.total_cents !== 17143 || saved.status !== "SENT") throw new Error(`Evento inicial, local, origem ou cálculo incorreto: ${JSON.stringify(saved)}`);
  const repeated = await expect(await request("/api/supplier/packages", { jar: supplierJar, body: { clientName: "Cliente Futuro", clientEmail, clientWhatsapp: clientPhone, locationName: "Outro nome não deve duplicar", locationAddress: `RUA DE TESTE ${suffix} 100`, locationCity: "FORTALEZA", locationState: "ce", eventType: "Casamento", eventTitle: "Teste de endereço repetido", eventDate: "2026-12-22", sendToClient: false, items: [{ serviceName: "Espaço", providerKind: "SELF", amountCents: 10000 }] } }), 201, "reutilização pelo endereço");
  const repeatedId = (await repeated.json()).packageId;
  const [repeatedLocation] = await sql.query("select event_location_id from event_packages where id=$1", [repeatedId]);
  if (repeatedLocation.event_location_id !== locationId) throw new Error("O mesmo endereço criou um local duplicado.");

  const supplierPage = await expect(await request("/fornecedor/pacotes", { jar: supplierJar, method: "GET" }), 200, "grade do fornecedor");
  const supplierHtml = await supplierPage.text();
  if (!supplierHtml.includes("Casamento criado pelo fornecedor") || !supplierHtml.includes("Cadastrar novo evento") || !supplierHtml.includes("Editar")) throw new Error("Grade de eventos do fornecedor incompleta.");

  await expect(await request(`/api/supplier/packages/${packageId}`, { jar: supplierJar, method: "PATCH", body: { clientName: "Cliente Futuro", clientEmail, clientWhatsapp: clientPhone, eventLocationId: locationId, eventType: "Casamento", eventTitle: "Casamento atualizado", eventDate: "2026-12-21", sendToClient: true, items: [{ serviceName: "Espaço", providerKind: "SELF", amountCents: 20000 }] } }), 200, "edição do evento");

  const clientJar = new Jar();
  await expect(await request("/api/auth/sign-up/email", { jar: clientJar, body: { name: "Cliente Futuro", email: clientEmail, password } }), 200, "cadastro posterior do cliente");
  await expect(await request("/api/onboarding", { jar: clientJar, body: { role: "CLIENT", whatsappName: "Cliente Futuro", whatsappNumber: clientPhone, acceptedTerms: true } }), 200, "vínculo pelo WhatsApp");
  [{ id: clientId }] = await sql.query("select id from users where email=$1", [clientEmail]);
  [saved] = await sql.query("select client_user_id,total_cents from event_packages where id=$1", [packageId]);
  if (saved.client_user_id !== clientId || saved.total_cents !== 22857) throw new Error("Vínculo posterior ou recálculo da edição incorreto.");

  const clientPage = await expect(await request("/cliente/planejamentos", { jar: clientJar, method: "GET" }), 200, "eventos unificados do cliente");
  const clientHtml = await clientPage.text();
  if (!clientHtml.includes("Casamento atualizado") || !clientHtml.includes("Cadastrado pelo fornecedor")) throw new Error("Evento não apareceu com a origem correta no portal do cliente.");
  const packagesPage = await expect(await request("/cliente/pacotes", { jar: clientJar, method: "GET" }), 200, "pacotes do cliente");
  const packagesHtml = await packagesPage.text();
  if (packagesHtml.includes("Taxa administrativa") || packagesHtml.includes("Comissão") || !packagesHtml.includes("228,57")) throw new Error("A comissão ficou explícita ou o total final não apareceu no painel do cliente.");
  const contractPage = await expect(await request(`/cliente/pacotes/${packageId}/contrato`, { jar: clientJar, method: "GET" }), 200, "contrato do cliente");
  const contractHtml = await contractPage.text();
  if (contractHtml.includes("Taxa administrativa") || contractHtml.includes("Comissão") || !contractHtml.includes("228,57")) throw new Error("A comissão ficou explícita ou o total final não apareceu no contrato.");
  console.log("Fluxo validado: grade, edição, contato pré-cadastrado, vínculo seguro e origem no portal do cliente.");
} finally {
  for (const id of [supplierId, clientId].filter(Boolean)) await sql.query("delete from audit_logs where actor_user_id=$1 or target_user_id=$1", [id]);
  if (supplierId) await sql.query("delete from users where id=$1", [supplierId]);
  if (clientId) await sql.query("delete from users where id=$1", [clientId]);
  await sql.query("delete from client_contacts where whatsapp_number=$1", [clientPhone]);
  if (locationId) await sql.query("delete from event_locations where id=$1", [locationId]);
}
