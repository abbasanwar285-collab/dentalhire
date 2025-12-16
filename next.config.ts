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
    ignoreBuildErrors: true,
  },

  experimental: {
    // Force webpack for compatibility with PWA plugin
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
