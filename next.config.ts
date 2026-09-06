import type { NextConfig } from "next";
/**
 * Content Security Policy.
 *
 * 'unsafe-eval' was removed after auditing every script the page loads and
 * then confirming it against real traffic with a Report-Only pass, which
 * produced no eval violations:
 *
 *   our bundles   no eval( or new Function( in any client chunk
 *   gtag.js       none
 *   checkout.js   new Function("return this") in webpack's global shim,
 *                 behind a globalThis check that short-circuits first,
 *                 inside a try/catch falling back to window
 *   pdf.js        isEvalSupported() is a try/catch probe returning false
 *                 under CSP; the glyph and PostScript compilers are gated
 *                 on it and fall back to interpreted paths. eval("require")
 *                 is guarded by isNodeJS and unreachable in a browser
 *
 * 'unsafe-inline' stays, and this is now a settled decision rather than a
 * postponed one. Counted against the built output on 2026-09-06:
 *
 *   1      theme-init script in app/layout.tsx -- one stable hash
 *   150    JSON-LD blocks -- data, never executed
 *   1756   Next.js RSC payload scripts (self.__next_f.push), up to 272 on a
 *          single page, content different per page AND per build
 *
 * The last row is the blocker. Those scripts are how streaming SSR ships the
 * component tree, their contents change whenever the page's data changes, and
 * Next has no mechanism to hash them. So hashes cannot express this policy at
 * any effort. The only alternative is a nonce, which must be minted per
 * response and read via headers() -- that opts every route into dynamic
 * rendering, giving up static prerendering on all 90 pages to close a hole
 * whose actual injection surface (admin-authored note HTML) is already
 * sanitized twice, server and client.
 *
 * Not worth it. The directives that carry real weight without that cost --
 * object-src 'none', base-uri 'self', form-action, and a report-uri that makes
 * blocks visible -- are all set below.
 *
 * If this is revisited: the theme-init hash is
 * sha256-Q6fewthwZb9fwmZHokySLOvfyM6u+WOZ7KsPge1K2z8=, and the count above is
 * reproducible by scanning .next/server/app/**\/*.html for inline <script>.
 */
const SCRIPT_SRC_BASE =
  "'self' 'unsafe-inline' https://checkout.razorpay.com https://cdn.razorpay.com https://www.googletagmanager.com https://www.google-analytics.com https://apis.google.com https://www.gstatic.com https://cdnjs.cloudflare.com";

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

// 'unsafe-eval' is gone. A report-only pass over real traffic -- checkout,
// the topper PDF viewer, the maps, chat -- produced no eval violations,
// matching the audit above.
//
// report-uri stays on the enforcing policy from here on. Without it a blocked
// resource fails silently: cdn.razorpay.com had been blocked on every checkout
// for as long as this policy has existed, and nothing surfaced it until the
// report-only pass went in.
const ContentSecurityPolicy = [
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
    // Body limit for PDF upload in chat.
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
  // serverComponentsExternalPackages was the experimental name for this and
  // was set to the same value alongside it; Next 16 warns and ignores the old
  // key. @google/generative-ai is gone from the list because nothing imports
  // it — the Gemini call in /api/evaluate uses fetch directly.
  serverExternalPackages: ['@react-pdf/renderer'],
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
        ],
      },
    ];
  },
};
export default nextConfig;
