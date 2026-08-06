import { readFile } from "node:fs/promises";
import { neon } from "@neondatabase/serverless";

const migrationPath = process.argv[2];
if (!migrationPath) throw new Error("Informe o arquivo de migração.");
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL não configurada.");

const migration = await readFile(migrationPath, "utf8");
const statements = migration.split("--> statement-breakpoint").map((statement) => statement.trim()).filter(Boolean);
const sql = neon(process.env.DATABASE_URL);
for (const statement of statements) await sql.query(statement);
console.log(`${statements.length} comandos aplicados com sucesso.`);
