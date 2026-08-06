import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { appRole, userProfiles, userRoles } from "@/lib/db/schema";

export type AppRole = (typeof appRole.enumValues)[number];

const blockedStatuses = new Set(["SUSPENDED", "BLOCKED", "REJECTED", "INACTIVE"]);

export async function getCurrentAccess() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  const db = getDb();
  const [profile] = await db.select().from(userProfiles).where(eq(userProfiles.userId, session.user.id)).limit(1);
  const roles = await db.select({ role: userRoles.role }).from(userRoles).where(eq(userRoles.userId, session.user.id));
  return {
    session,
    profile: profile ?? null,
    roles: roles.map(({ role }) => role),
  };
}

export function hasAnyRole(roles: AppRole[], allowed: AppRole[]) {
  return allowed.some((role) => roles.includes(role));
}

export function isAccessBlocked(status?: string | null) {
  return Boolean(status && blockedStatuses.has(status));
}

export function canViewFinancialResults(roles: AppRole[]) {
  return roles.includes("ADMIN");
}

export async function requirePageRole(allowed: AppRole[]) {
  const access = await getCurrentAccess();
  if (!access) redirect("/entrar");
  if (!access.profile) redirect("/onboarding");
  if (isAccessBlocked(access.profile.status)) redirect("/acesso-bloqueado");
  if (!hasAnyRole(access.roles, allowed)) redirect("/painel");
  return access;
}
