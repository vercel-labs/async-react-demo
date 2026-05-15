import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
