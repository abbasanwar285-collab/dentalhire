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

  // Note: experimental.turbopack config removed - it was invalid in Next.js 16
  // The PWA plugin uses webpack by default, which is compatible

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
