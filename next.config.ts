import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3"],
  cacheComponents: true,
  typedRoutes: true,
  experimental: {
    instantInsights: {
      validationLevel: "warning",
    },
    useOffline: true,
    varyParams: true,
    prefetchInlining: true,
    optimisticRouting: true,
    cachedNavigations: true,
  },
};

export default nextConfig;
