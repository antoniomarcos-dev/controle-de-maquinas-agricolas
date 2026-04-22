import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    memoryBasedWorkersCount: true,
  },
};

export default nextConfig;
