import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const securityHeaders = [
  // Prevent MIME-type sniffing
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Disallow embedding in iframes (clickjacking protection)
  { key: "X-Frame-Options", value: "DENY" },
  // Control referrer information sent with requests
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Disable browser features we don't use
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
  // Content Security Policy
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Next.js needs unsafe-inline for inline scripts; unsafe-eval for webpack runtime
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      // Inline styles are used by Next.js and shadcn/ui
      "style-src 'self' 'unsafe-inline'",
      // Allow self-hosted fonts (next/font downloads at build time)
      "font-src 'self'",
      // Images: self + data URIs + Riot Data Dragon CDN for champion/item assets
      "img-src 'self' data: blob: https://ddragon.leagueoflegends.com https://raw.communitydragon.org",
      // API calls: self + Sentry error reporting
      "connect-src 'self' https://*.sentry.io https://ingest.us.sentry.io",
      // Sentry session replay uses a blob worker
      "worker-src 'self' blob:",
      // Prevent this page from being framed
      "frame-ancestors 'none'",
      // Only allow forms to submit to self
      "form-action 'self'",
      // Restrict <base> tag
      "base-uri 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client"],
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default process.env.NEXT_PUBLIC_SENTRY_DSN
  ? withSentryConfig(nextConfig, {
      org: process.env.SENTRY_ORG ?? "",
      project: process.env.SENTRY_PROJECT ?? "",
      silent: !process.env.CI,
      widenClientFileUpload: true,
    })
  : nextConfig;
