import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  allowedDevOrigins: [
    "https://localhost:3000",
    "https://127.0.0.1:3000",
    "https://*.local:3000",
  ],
};

export default nextConfig;
