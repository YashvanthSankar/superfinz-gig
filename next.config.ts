import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@superfinz/shared"],
  experimental: {
    staleTimes: {
      dynamic: 30,   // cache visited pages for 30s on client
      static: 180,
    },
  },
};

export default nextConfig;
