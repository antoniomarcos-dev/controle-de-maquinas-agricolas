import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  // Turbopack config (required by Next.js 16)
  turbopack: {},
};

export default nextConfig;
