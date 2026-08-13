import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { getDb } from "@/lib/db";
import { authSchema } from "@/lib/db/schema";

const googleEnabled = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
const fallbackSecret = "bora-development-only-secret-change-before-production-2026";
export const appBaseURL = process.env.BETTER_AUTH_URL ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
const isLocalBaseURL = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(appBaseURL);
const authSecret = process.env.BETTER_AUTH_SECRET ?? (process.env.NODE_ENV === "production" ? undefined : fallbackSecret);

if (!authSecret) throw new Error("BETTER_AUTH_SECRET não configurada para produção.");

export const auth = betterAuth({
  appName: "BORA",
  baseURL: appBaseURL,
  secret: authSecret,
  database: drizzleAdapter(getDb(), {
    provider: "pg",
    schema: authSchema,
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    autoSignIn: true,
  },
  socialProviders: googleEnabled ? {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  } : {},
  advanced: {
    database: { generateId: "uuid" },
    useSecureCookies: process.env.NODE_ENV === "production" && !isLocalBaseURL,
  },
  trustedOrigins: [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
    "https://bora-livid-nine.vercel.app",
    "https://boracurtirbora.com.br",
    "https://www.boracurtirbora.com.br",
    appBaseURL,
  ],
});

export const isGoogleAuthEnabled = googleEnabled;
