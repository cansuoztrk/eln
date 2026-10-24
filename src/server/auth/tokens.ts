import { createHash, randomBytes } from "node:crypto";

export function newToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

/** Veritabanında ham token yerine yalnızca SHA-256 özeti saklanır. */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
