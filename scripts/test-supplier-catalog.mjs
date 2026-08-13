import { del, put } from "@vercel/blob";
import { neon } from "@neondatabase/serverless";

if (process.env.ALLOW_SUPPLIER_CATALOG_TESTS !== "true") throw new Error("Defina ALLOW_SUPPLIER_CATALOG_TESTS=true para executar este teste temporário.");
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL não configurada.");
if (!process.env.BLOB_READ_WRITE_TOKEN) throw new Error("BLOB_READ_WRITE_TOKEN não configurado.");

const baseURL = process.env.TEST_BASE_URL ?? "http://localhost:3001";
const sql = neon(process.env.DATABASE_URL);
const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const email = `teste-catalogo-${suffix}@bora.local`;
const password = `Bora-${suffix}-A1!`;
const customServiceName = `Serviço temporário ${suffix}`;
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl2z9sAAAAASUVORK5CYII=", "base64");
let blobUrl = null;

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

async function request(path, { jar, body, method = "POST" } = {}) {
  const headers = { origin: baseURL };
  if (body !== undefined) headers["content-type"] = "application/json";
  if (jar?.value()) headers.cookie = jar.value();
  const response = await fetch(`${baseURL}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body), redirect: "manual" });
  jar?.update(response.headers);
  return response;
}

async function requireStatus(response, expected, label) {
  if (response.status !== expected) throw new Error(`${label}: esperado ${expected}, recebido ${response.status}: ${(await response.text()).slice(0, 300)}`);
  return response;
}

try {
  await requireStatus(await request("/api/supplier/listings", { body: {} }), 401, "bloqueio sem autenticação");
  const jar = new CookieJar();
  await requireStatus(await request("/api/auth/sign-up/email", { jar, body: { name: "Fornecedor Catálogo", email, password } }), 200, "cadastro do fornecedor");
  await requireStatus(await request("/api/onboarding", { jar, body: { role: "SUPPLIER", whatsappName: "Catálogo Teste", whatsappNumber: "85999990004", acceptedTerms: true, acceptsOperationalMessages: true, acceptsMarketing: false, businessName: "Experiências Teste", customServices: ["Decoração"] } }), 200, "perfil do fornecedor");
  const [supplier] = await sql.query("SELECT id FROM users WHERE email = $1", [email]);
  await requireStatus(await request("/api/supplier/listings", { jar, body: {} }), 403, "bloqueio do fornecedor ainda não aprovado");
  await sql.query("UPDATE supplier_profiles SET approval_status = 'ACTIVE', updated_at = now() WHERE user_id = $1", [supplier.id]);

  const serviceOptions = await sql.query("SELECT id FROM service_categories WHERE normalized_name IN ('espaco para festas', 'buffet e alimentacao', 'decoracao') ORDER BY normalized_name");
  if (serviceOptions.length !== 3) throw new Error("As categorias de serviços para o teste não foram encontradas.");
  await requireStatus(await request("/api/supplier/services", { jar, method: "PATCH", body: {
    serviceIds: serviceOptions.map(({ id }) => id),
    customServices: [customServiceName],
  } }), 200, "atualização dos múltiplos serviços da empresa");
  const [linkedServices] = await sql.query("SELECT COUNT(*)::int AS total FROM supplier_services WHERE supplier_user_id = $1", [supplier.id]);
  if (linkedServices.total !== 4) throw new Error("Os múltiplos serviços da empresa não foram persistidos.");
  const [learnedService] = await sql.query("SELECT active FROM service_categories WHERE name = $1", [customServiceName]);
  if (!learnedService?.active) throw new Error("O novo serviço não virou uma sugestão ativa.");

  const blob = await put(`suppliers/${supplier.id}/teste-catalogo.png`, png, { access: "private", contentType: "image/png", addRandomSuffix: true });
  blobUrl = blob.url;
  const createdResponse = await requireStatus(await request("/api/supplier/listings", { jar, body: {
    type: "DECORATION_THEME",
    name: "Jardim encantado",
    description: "Tema completo com painel, mesa principal, suportes e elementos decorativos.",
    priceCents: 250000,
    priceUnit: "PER_EVENT",
    capacity: null,
    city: null,
    state: null,
    status: "DRAFT",
    images: [{ url: blob.url, pathname: blob.pathname, altText: "Tema Jardim encantado" }],
  } }), 201, "criação do tema");
  const { listingId } = await createdResponse.json();
  const [image] = await sql.query("SELECT id FROM supplier_listing_images WHERE listing_id = $1", [listingId]);
  await requireStatus(await request(`/api/supplier/images/${image.id}`, { jar, method: "GET" }), 200, "leitura privada da foto pelo fornecedor");
  await requireStatus(await request(`/api/supplier/images/${image.id}`, { method: "GET" }), 403, "bloqueio público do rascunho");
  await requireStatus(await request(`/api/supplier/listings/${listingId}`, { jar, method: "PATCH", body: { priceCents: 275000, status: "PUBLISHED" } }), 200, "atualização e publicação");
  await requireStatus(await request(`/api/supplier/images/${image.id}`, { method: "GET" }), 200, "leitura da foto publicada");
  const [updated] = await sql.query("SELECT price_cents, status FROM supplier_listings WHERE id = $1", [listingId]);
  if (updated.price_cents !== 275000 || updated.status !== "PUBLISHED") throw new Error("Preço ou publicação não foram persistidos.");
  await requireStatus(await request(`/api/supplier/listings/${listingId}`, { jar, method: "DELETE" }), 200, "exclusão do item");
  blobUrl = null;
  const remaining = await sql.query("SELECT id FROM supplier_listings WHERE id = $1", [listingId]);
  if (remaining.length) throw new Error("O item excluído permaneceu no banco.");
  console.log("Fluxo validado: aprovação, tema com foto privada e preço, edição, publicação, leitura protegida e exclusão.");
} finally {
  if (blobUrl) await del(blobUrl).catch(() => undefined);
  await sql.query("DELETE FROM audit_logs WHERE actor_user_id IN (SELECT id FROM users WHERE email = $1) OR target_user_id IN (SELECT id FROM users WHERE email = $1)", [email]);
  await sql.query("DELETE FROM users WHERE email = $1", [email]);
  await sql.query("DELETE FROM service_categories WHERE name = $1", [customServiceName]);
}
