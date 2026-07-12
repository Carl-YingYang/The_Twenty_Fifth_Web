import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // P1: do NOT hide TypeScript or ESLint errors during build. The app
  // must fail the build loudly if there are type or lint issues, so they
  // get fixed before deploy rather than shipping broken code.
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  reactStrictMode: false,
  allowedDevOrigins: ["*.space-z.ai", "*.z.ai", "localhost", "127.0.0.1"],
};

export default nextConfig;
