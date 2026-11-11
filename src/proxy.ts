import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Runs before every page request. Three jobs:
 *   1. keep the session fresh (rotating refresh tokens back into cookies),
 *   2. keep everyone who is not a member out of the world,
 *   3. attach a per-request Content-Security-Policy.
 *
 * This is the outer gate only. Every page and action re-checks the session,
 * and the database enforces row level security underneath both.
 */

const PUBLIC_PATHS = [/^\/login$/, /^\/setup$/, /^\/invite\/[^/]+$/, /^\/unconfigured$/, /^\/offline$/];

const REQUIRED = [
  "SUPABASE_URL",
  "SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "APP_SECRET",
  "SETUP_SECRET",
] as const;

function backendOrigin(): string | null {
  try {
    return process.env.SUPABASE_URL ? new URL(process.env.SUPABASE_URL).origin : null;
  } catch {
    return null;
  }
}

function contentSecurityPolicy(nonce: string): string {
  const dev = process.env.NODE_ENV !== "production";
  const backend = backendOrigin() ?? "";
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${dev ? " 'unsafe-eval'" : ""}`,
    // Motion writes inline styles; scripts stay nonce-locked.
    "style-src 'self' 'unsafe-inline'",
    `img-src 'self' data: blob: ${backend}`,
    `media-src 'self' blob: ${backend}`,
    "font-src 'self'",
    // Direct-to-storage uploads use a one-time signed URL on the backend origin.
    `connect-src 'self' ${backend}${dev ? " ws: wss:" : ""}`,
    // Loaded only after the person presses play on the song.
    "frame-src https://www.youtube-nocookie.com https://open.spotify.com",
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(dev ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = contentSecurityPolicy(nonce);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const finish = (response: NextResponse) => {
    response.headers.set("Content-Security-Policy", csp);
    return response;
  };

  const configured = REQUIRED.every((key) => Boolean(process.env[key]));
  if (!configured) {
    if (pathname === "/unconfigured") {
      return finish(NextResponse.next({ request: { headers: requestHeaders } }));
    }
    return finish(NextResponse.redirect(new URL("/unconfigured", request.url)));
  }
  if (pathname === "/unconfigured") {
    return finish(NextResponse.redirect(new URL("/", request.url)));
  }

  let response = NextResponse.next({ request: { headers: requestHeaders } });
  const refreshed: { name: string; value: string; options: Record<string, unknown> }[] = [];

  const supabase = createServerClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        for (const { name, value, options } of list) {
          request.cookies.set(name, value);
          refreshed.push({
            name,
            value,
            options: {
              ...options,
              httpOnly: true,
              sameSite: "lax",
              secure: process.env.NODE_ENV === "production",
              path: "/",
            },
          });
        }
        response = NextResponse.next({ request: { headers: requestHeaders } });
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims?.sub);

  const withCookies = (res: NextResponse) => {
    for (const cookie of refreshed) res.cookies.set(cookie.name, cookie.value, cookie.options);
    return finish(res);
  };

  const isPublic = PUBLIC_PATHS.some((pattern) => pattern.test(pathname));

  if (!signedIn && !isPublic) {
    const url = new URL("/login", request.url);
    if (pathname !== "/" && !pathname.startsWith("/api/")) url.searchParams.set("next", pathname);
    return withCookies(NextResponse.redirect(url));
  }

  if (signedIn && pathname === "/login") {
    return withCookies(NextResponse.redirect(new URL("/", request.url)));
  }

  return withCookies(response);
}

export const config = {
  matcher: [
    // Everything except build output and static files.
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|robots.txt|sw.js|.*\\.(?:svg|png|jpg|jpeg|webp|avif|ico|woff2?)$).*)",
  ],
};
