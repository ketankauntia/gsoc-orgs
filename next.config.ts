import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // React Strict Mode is enabled by default in Next.js 13+
  // This causes double-renders in development (intentional)
  // If you experience "double-click" issues in dev, test with: npm run build && npm run start
  reactStrictMode: true,
  images: {
    // Disable image optimization to reduce Vercel usage
    // Organization logos are already optimized and cached on Cloudflare R2
    unoptimized: false, // Keep false to allow unoptimized prop per-image
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
  async redirects() {
    // 301 redirects from old /gsoc-YYYY-organizations to new /yearly/google-summer-of-code-YYYY
    // This preserves SEO link equity and ensures Google indexes only the new URLs
    const redirects = [];
    
    // Generate redirects for years 2016-2030 (reasonable upper bound)
    for (let year = 2016; year <= 2030; year++) {
      redirects.push({
        source: `/gsoc-${year}-organizations`,
        destination: `/yearly/google-summer-of-code-${year}`,
        permanent: true, // 301 redirect
      });
    }
    
    return redirects;
  },
};

export default nextConfig;
