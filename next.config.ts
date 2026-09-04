import type { NextConfig } from "next";
/**
 * Both policies are built from one list so they cannot drift apart.
 *
 * SCRIPT_SRC_BASE is everything the page legitimately loads. The enforcing
 * policy adds 'unsafe-eval'; the Report-Only policy does not, so browsers
 * report anything that would break if it were removed, while the page keeps
 * working. Nothing else differs between them, which means every report is
 * unambiguously about eval.
 *
 * The audit of what actually needs it:
 *   checkout.js       new Function("return this") behind a globalThis check
 *                     that short-circuits first, inside a try/catch
 *   pdf.js            a try/catch probe (isEvalSupported), plus two call sites
 *                     gated on that probe with interpreted fallbacks
 *   pdf.js            eval("require") guarded by an isNodeJS check
 *   gtag.js           none
 *
 * All degrade rather than fail, so this is expected to report nothing. Promote
 * it to enforcing once real traffic through checkout, the topper PDF viewer
 * and the maps has produced no [csp] lines in the logs.
 */
const SCRIPT_SRC_BASE =
  "'self' 'unsafe-inline' https://checkout.razorpay.com https://www.googletagmanager.com https://www.google-analytics.com https://apis.google.com https://www.gstatic.com https://cdnjs.cloudflare.com";

const cspDirectives = (scriptSrc: string) => [
  "default-src 'self'",
  `script-src ${scriptSrc}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob: https:",
  "media-src 'self'",
  "connect-src 'self' blob: https://*.supabase.co wss://*.supabase.co https://api.groq.com https://api.jina.ai https://checkout.razorpay.com https://lumberjack.razorpay.com https://api.razorpay.com https://*.razorpay.com https://*.googleapis.com https://*.firebaseapp.com https://*.firebase.com wss://*.firebaseio.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://pub-163b2186589649f4a759ed969e0779e0.r2.dev https://*.r2.cloudflarestorage.com https://cdnjs.cloudflare.com",
  "frame-src 'self' https://checkout.razorpay.com https://*.razorpay.com https://*.firebaseapp.com https://accounts.google.com",
  "worker-src 'self' blob: https://checkout.razorpay.com https://cdnjs.cloudflare.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' https://*.razorpay.com https://*.firebaseapp.com https://accounts.google.com",
  "upgrade-insecure-requests",
];

// Unchanged from before: still permits eval, so nothing can break today.
const ContentSecurityPolicy = cspDirectives(`${SCRIPT_SRC_BASE} 'unsafe-eval'`).join('; ');

// The candidate. Violations are reported, never enforced.
const ContentSecurityPolicyReportOnly = [
  ...cspDirectives(SCRIPT_SRC_BASE),
  "report-uri /api/csp-report",
].join('; ');
export const maxDuration = 30;

// Firebase always serves the real auth handler from <project>.firebaseapp.com.
// Proxying it under our own origin makes the sign-in handshake first-party, so
// the consent screen shows historyoptional.xyz instead of the firebaseapp.com
// project host. Inert until NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN points at our domain.
const FIREBASE_AUTH_UPSTREAM = `${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}.firebaseapp.com`;

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
    serverComponentsExternalPackages: ['@google/generative-ai', '@react-pdf/renderer'],
  },
  // Increase body size limit for PDF upload in chat
  serverExternalPackages: ['@google/generative-ai', '@react-pdf/renderer'],
  images: { unoptimized: true },
  async rewrites() {
    return [
      {
        source: '/__/auth/:path*',
        destination: `https://${FIREBASE_AUTH_UPSTREAM}/__/auth/:path*`,
      },
      {
        source: '/__/firebase/:path*',
        destination: `https://${FIREBASE_AUTH_UPSTREAM}/__/firebase/:path*`,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/sitemap.xml',
        headers: [
          { key: 'Content-Type', value: 'application/xml; charset=utf-8' },
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
        // The proxied auth handler is Google's own page — our CSP and X-Frame-Options would break it.
        source: '/((?!sitemap.xml|robots.txt|__/).*)',
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
          // Sends violations for the stricter policy without enforcing it.
          // Remove once 'unsafe-eval' is dropped from the line above.
          { key: 'Content-Security-Policy-Report-Only', value: ContentSecurityPolicyReportOnly },
        ],
      },
    ];
  },
};
export default nextConfig;
