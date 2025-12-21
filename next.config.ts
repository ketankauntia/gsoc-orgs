import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ik.imagekit.io',
      },
      {
        protocol: 'https',
        hostname: 'html.tailus.io',
      },
      {
        protocol: 'https',
        hostname: 'summerofcode.withgoogle.com',
      },
      {
        protocol: 'https',
        hostname: 'pub-268c3a1efc8b4f8a99115507a760ca14.r2.dev',
      },
    ],
  },
};

export default nextConfig;
