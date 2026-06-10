import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    appShells: true,
  },
  typedRoutes: true,
};

export default nextConfig;
