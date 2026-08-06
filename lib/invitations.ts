import { createHash, randomBytes } from "node:crypto";

export function createInvitationToken() {
  return randomBytes(32).toString("base64url");
}

export function hashInvitationToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function invitationExpiresAt(hours = 72) {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}
