import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/',
        destination: '/discussions',
        permanent: true,
      },
    ];
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "3mb",
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com", // Google OAuth profile pictures
      },
    ],
  },
};

export default nextConfig;
