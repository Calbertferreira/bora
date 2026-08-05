import { neon } from "@neondatabase/serverless";

export async function GET() {
  const url = process.env.DATABASE_URL;
  if (!url) return Response.json({ status: "ok", database: "not-configured" });
  try {
    await neon(url)`select 1`;
    return Response.json({ status: "ok", database: "connected" });
  } catch {
    return Response.json({ status: "degraded", database: "unavailable" }, { status: 503 });
  }
}
