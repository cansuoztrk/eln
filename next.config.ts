import type { NextConfig } from "next";

/**
 * Security headers that are the same for every response. The
 * Content-Security-Policy carries a per-request nonce and is set in
 * `src/proxy.ts` instead.
 */
const securityHeaders = [
  { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive, nosnippet, noimageindex" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "no-referrer" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  // The microphone is allowed for our own origin only (voice memories); it is
  // requested when someone presses "record", never before. Everything else is off.
  {
    key: "Permissions-Policy",
    value:
      "microphone=(self), camera=(), geolocation=(), payment=(), usb=(), browsing-topics=(), interest-cohort=()",
  },
  ...(process.env.NODE_ENV === "production"
    ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" }]
    : []),
];

const nextConfig: NextConfig = {
  // `cacheComponents` is deliberately off: every page depends on the session and
  // on signed URLs that expire. See the decision log in CLAUDE.md.
  poweredByHeader: false,
  // Lets the dev server be opened as 127.0.0.1 as well as localhost.
  allowedDevOrigins: ["127.0.0.1"],
  reactStrictMode: true,
  // sharp ships native binaries; keep it out of the bundle.
  serverExternalPackages: ["sharp"],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
