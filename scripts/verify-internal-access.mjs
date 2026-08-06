import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL não configurada.");
const sql = neon(process.env.DATABASE_URL);
const expected = ["audit_logs", "internal_invitations"];
const rows = await sql.query(
  "SELECT table_name FROM information_schema.tables WHERE table_schema = $1 AND table_name IN ($2, $3) ORDER BY table_name",
  ["public", ...expected],
);
const found = rows.map(({ table_name }) => table_name);
if (found.join(",") !== expected.join(",")) throw new Error(`Estruturas ausentes: ${expected.filter((name) => !found.includes(name)).join(", ")}`);
console.log(`Estruturas internas verificadas: ${found.join(", ")}.`);
