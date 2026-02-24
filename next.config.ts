import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone', // ✅ standalone build for SSR
  reactStrictMode: true,
};

export default nextConfig;
