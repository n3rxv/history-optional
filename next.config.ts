import type { NextConfig } from "next";
const ContentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://www.googletagmanager.com https://www.google-analytics.com https://apis.google.com https://www.gstatic.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob: https:",
  "media-src 'self'",
  "connect-src 'self' blob: https://*.supabase.co wss://*.supabase.co https://api.groq.com https://api.jina.ai https://checkout.razorpay.com https://lumberjack.razorpay.com https://api.razorpay.com https://*.razorpay.com https://*.googleapis.com https://*.firebaseapp.com https://*.firebase.com wss://*.firebaseio.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com",
  "frame-src https://checkout.razorpay.com https://*.razorpay.com https://*.firebaseapp.com https://accounts.google.com",
  "worker-src 'self' blob: https://checkout.razorpay.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' https://*.razorpay.com",
  "upgrade-insecure-requests",
].join('; ');
const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
    serverComponentsExternalPackages: ['@google/generative-ai'],
  },
  // Increase body size limit for PDF upload in chat
  serverExternalPackages: ['@google/generative-ai'],
  images: { unoptimized: true },
  async headers() {
    return [
      {
        source: '/sitemap.xml',
        headers: [
          { key: 'Content-Type', value: 'text/xml; charset=utf-8' },
          { key: 'Cache-Control', value: 'public, max-age=3600' },
        ],
      },
      {
        source: '/robots.txt',
        headers: [
          { key: 'Content-Type', value: 'text/plain' },
          { key: 'Cache-Control', value: 'public, max-age=3600' },
          { key: 'Vary', value: '' },
        ],
      },
      {
        source: '/((?!sitemap.xml|robots.txt).*)',
        headers: [
          { key: 'X-Frame-Options',           value: 'DENY' },
          { key: 'Cross-Origin-Opener-Policy',  value: 'same-origin-allow-popups' },
          { key: 'Cross-Origin-Embedder-Policy', value: 'unsafe-none' },
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
