import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Force webpack mode (Turbopack is disabled via package.json script)
  webpack: (config) => {
    return config;
  },
};

export default nextConfig;
