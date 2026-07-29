import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.amazonaws.com",
      },
    ],
  },
  async rewrites() {
    const backendApiBaseUrl = process.env.BACKEND_API_BASE_URL;

    if (!backendApiBaseUrl) {
      return [];
    }

    return [
      {
        source: "/api/:path*",
        destination: `${backendApiBaseUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
