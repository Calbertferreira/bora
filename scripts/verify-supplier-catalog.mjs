import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL não configurada.");

const sql = neon(process.env.DATABASE_URL);
const expected = ["supplier_listing_images", "supplier_listings"];
const rows = await sql.query(
  "SELECT table_name FROM information_schema.tables WHERE table_schema = $1 AND table_name IN ($2, $3) ORDER BY table_name",
  ["public", ...expected],
);
const found = rows.map(({ table_name }) => table_name);
const missing = expected.filter((name) => !found.includes(name));
if (missing.length) throw new Error(`Estruturas ausentes: ${missing.join(", ")}`);

const constraints = await sql.query(
  "SELECT COUNT(*)::int AS total FROM information_schema.table_constraints WHERE table_schema = 'public' AND table_name IN ('supplier_listings', 'supplier_listing_images')",
);
console.log(`Catálogo verificado: ${found.join(", ")} (${constraints[0].total} restrições).`);
