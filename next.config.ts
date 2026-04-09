import type { NextConfig } from "next";

const ContentSecurityPolicy = [
  "default-src 'self'",
  // Next.js needs unsafe-inline for styles; unsafe-eval for dev HMR (remove in prod if possible)
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob: https:",
  "media-src 'self'",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.groq.com https://checkout.razorpay.com https://lumberjack.razorpay.com https://api.razorpay.com https://*.razorpay.com",
  "frame-src https://checkout.razorpay.com https://*.razorpay.com",
  "worker-src blob: https://checkout.razorpay.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' https://*.razorpay.com",
  "upgrade-insecure-requests",
].join('; ');

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "15mb", // lowered from 20mb (10 files × ~1.5MB avg)
    },
  },
  images: { unoptimized: true },
  async headers() {
    return [
      {
        source: '/sitemap.xml',
        headers: [
          { key: 'Content-Type', value: 'application/xml' },
          { key: 'X-Robots-Tag', value: 'noindex' },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options',           value: 'DENY' },
          { key: 'X-Content-Type-Options',     value: 'nosniff' },
          { key: 'Referrer-Policy',            value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy',         value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'X-XSS-Protection',           value: '1; mode=block' },
          { key: 'Strict-Transport-Security',  value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'Content-Security-Policy',    value: ContentSecurityPolicy },
        ],
      },
    ];
  },
};

export default nextConfig;
