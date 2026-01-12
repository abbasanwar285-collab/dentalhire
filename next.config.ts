import type { NextConfig } from "next";

const withPWA = require("@ducanh2912/next-pwa").default({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  workboxOptions: {
    importScripts: ['/custom-sw.js'],
  },
});

const nextConfig = {
  typescript: {
    ignoreBuildErrors: false, // ✅ Fixed: Will now show TypeScript errors
  },

  experimental: {
    // IMPORTANT: Must keep turbopack disabled because:
    // - @ducanh2912/next-pwa uses webpack configuration
    // - Turbopack doesn't support workbox plugins yet
    // - Next.js 16 defaults to Turbopack, so explicit disable is required
    turbopack: false,
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
};

export default withPWA(nextConfig);

// Force restart - Vercel Trigger
