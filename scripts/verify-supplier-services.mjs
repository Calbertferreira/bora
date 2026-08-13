import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL não configurada.");

const sql = neon(process.env.DATABASE_URL);
const tables = await sql.query(
  "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('service_categories', 'supplier_services') ORDER BY table_name",
);
if (tables.length !== 2) throw new Error("As tabelas de serviços do fornecedor não foram encontradas.");

const [categories] = await sql.query("SELECT COUNT(*)::int AS total FROM service_categories WHERE active = true");
if (categories.total < 20) throw new Error("As sugestões iniciais de serviços não foram carregadas.");

const [relations] = await sql.query("SELECT COUNT(*)::int AS total FROM supplier_services");
console.log(`Serviços verificados: ${categories.total} sugestões ativas e ${relations.total} vínculos de fornecedores.`);
