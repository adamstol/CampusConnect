import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const backendApiBaseUrl = process.env.BACKEND_API_BASE_URL;

    if (!backendApiBaseUrl) {
      return [];
    }

    return [
      {
        source: '/api/:path*',
        destination: `${backendApiBaseUrl}/:path*`,
      },
    ];
  },
};

export default nextConfig;
