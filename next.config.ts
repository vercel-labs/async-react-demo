import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  reactCompiler: true,
  partialPrefetching: true,
  typedRoutes: true,
};

export default nextConfig;
