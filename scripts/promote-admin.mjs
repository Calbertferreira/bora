import { neon } from "@neondatabase/serverless";

function getEmail() {
  const args = process.argv.slice(2);
  const inline = args.find((argument) => argument.startsWith("--email="));
  if (inline) return inline.slice("--email=".length);
  const index = args.indexOf("--email");
  return index >= 0 ? args[index + 1] : undefined;
}

const email = getEmail()?.trim().toLowerCase();
if (!email || !email.includes("@")) throw new Error("Informe --email=usuario@exemplo.com.");
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL não configurada.");

const sql = neon(process.env.DATABASE_URL);
const [user] = await sql`SELECT id, email FROM users WHERE lower(email) = ${email} LIMIT 1`;
if (!user) throw new Error("Conta não encontrada. Cadastre a pessoa e conclua o perfil antes da promoção.");
const [profile] = await sql`SELECT user_id FROM user_profiles WHERE user_id = ${user.id} LIMIT 1`;
if (!profile) throw new Error("Perfil incompleto. Entre na conta e conclua o cadastro antes da promoção.");

await sql`UPDATE user_profiles SET status = 'ACTIVE', updated_at = now() WHERE user_id = ${user.id}`;
await sql`INSERT INTO user_roles (user_id, role) VALUES (${user.id}, 'ADMIN') ON CONFLICT DO NOTHING`;
await sql`INSERT INTO audit_logs (actor_user_id, target_user_id, action, details) VALUES (${user.id}, ${user.id}, 'BOOTSTRAP_ADMIN_GRANTED', ${JSON.stringify({ source: "promote-admin-script", email })}::jsonb)`;

console.log(`Acesso de administrador concedido a ${user.email}.`);
