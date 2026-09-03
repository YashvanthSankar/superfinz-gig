import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@superfinz/shared"],
  async redirects() {
    return [
      {
        source: "/dashboard/budgets",
        destination: "/dashboard/plan",
        permanent: false,
      },
      {
        source: "/dashboard/calculators",
        destination: "/dashboard/plan",
        permanent: false,
      },
      {
        source: "/dashboard/goals",
        destination: "/dashboard/safety",
        permanent: false,
      },
      {
        source: "/dashboard/heatmap",
        destination: "/dashboard/income",
        permanent: false,
      },
      {
        source: "/dashboard/learn",
        destination: "/dashboard/coach",
        permanent: false,
      },
      {
        source: "/dashboard/learn/:path*",
        destination: "/dashboard/coach",
        permanent: false,
      },
      {
        source: "/dashboard/news",
        destination: "/dashboard/coach",
        permanent: false,
      },
      {
        source: "/dashboard/profile",
        destination: "/dashboard/settings",
        permanent: false,
      },
      {
        source: "/dashboard/retirement",
        destination: "/dashboard/safety",
        permanent: false,
      },
      {
        source: "/dashboard/transactions",
        destination: "/dashboard/income",
        permanent: false,
      },
    ];
  },
  experimental: {
    staleTimes: {
      dynamic: 30, // cache visited pages for 30s on client
      static: 180,
    },
  },
};

export default nextConfig;
