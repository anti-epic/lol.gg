import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  // moved from experimental.serverComponentsExternalPackages in Next.js 15+
  serverExternalPackages: ["@prisma/client"],
};

// Only wrap with Sentry when a DSN is configured
export default process.env.NEXT_PUBLIC_SENTRY_DSN
  ? withSentryConfig(nextConfig, {
      org: process.env.SENTRY_ORG ?? "",
      project: process.env.SENTRY_PROJECT ?? "",
      silent: !process.env.CI,
      widenClientFileUpload: true,
    })
  : nextConfig;
