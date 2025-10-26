import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable Turbopack to avoid WASM bindings compatibility issues
  // when native SWC has code signature errors on macOS
  experimental: {
    turbo: undefined, // Explicitly don't use turbo
  },
  // Force webpack mode
  webpack: (config) => {
    return config;
  },
};

export default nextConfig;
