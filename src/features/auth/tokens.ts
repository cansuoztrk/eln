import "server-only";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { headers } from "next/headers";
import { getEnv } from "@/lib/env";

/** A fresh, unguessable invite token (256 bits, URL-safe). */
export function newInviteToken(): string {
  return randomBytes(32).toString("base64url");
}

/** Only this hash is ever stored. */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Compares two secrets without leaking where they differ. */
export function secretsMatch(a: string, b: string): boolean {
  const left = createHash("sha256").update(a).digest();
  const right = createHash("sha256").update(b).digest();
  return timingSafeEqual(left, right);
}

/** The public origin of the site, for building links the owner will share. */
export async function siteOrigin(): Promise<string> {
  const configured = getEnv().SITE_URL;
  if (configured) return new URL(configured).origin;
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https");
  return `${proto}://${host}`;
}

/** Only same-site paths are accepted as a post-login destination. */
export function safeNextPath(next: string | undefined | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("\\")) return "/";
  if (next.startsWith("/login") || next.startsWith("/setup") || next.startsWith("/invite")) return "/";
  return next;
}
