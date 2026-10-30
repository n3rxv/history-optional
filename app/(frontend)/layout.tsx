// Variable builds: one file per family instead of one per weight.
import '@fontsource-variable/libre-baskerville';                 // roman, 400-700
import '@fontsource-variable/libre-baskerville/wght-italic.css'; // 31 blockquotes are italic at element level
import '@fontsource/gelasio/400.css';                            // display fallback for Android
import '@fontsource/gelasio/700.css';                            // Georgia is not on Android
import '@fontsource-variable/inter';                             // UI, 400-700
import '@fontsource/roboto/400-italic.css';                      // inline <em>, see globals.css
import '@fontsource/roboto/700-italic.css';                      // 7 spans nest <strong> inside <em>
import '@fontsource/ibm-plex-mono/400.css';                      // eyebrows, marks tags, figures
import '@fontsource/ibm-plex-mono/500.css';
import Script from 'next/script';
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WeeklyCheckup from "@/components/WeeklyCheckup";
import VisitorTracker from "@/components/VisitorTracker";
import ProgressSync from '@/components/ProgressSync';
import PhoneGate from "@/components/PhoneGate";
import AuthRedirectHandler from "@/components/AuthRedirectHandler";
import BottomNav from "@/components/BottomNav";
import Toaster from "@/components/ui/Toast";
import ConfirmHost from "@/components/ui/ConfirmDialog";
import PWARegister from "@/components/PWARegister";
import InAppBrowserNotice from "@/components/InAppBrowserNotice";
import PromoPopup from "@/components/PromoPopup";
import { LangProvider } from "@/lib/i18n/LangContext";

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  // The browser's own bar, in the paper colour; the navbar switches it for dark.
  themeColor: '#fcfcfc',
};

export const metadata: Metadata = {
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'History Optional',
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.png', type: 'image/png', sizes: '32x32' },
      { url: '/icon-192.png', type: 'image/png', sizes: '192x192' },
      { url: '/icon-512.png', type: 'image/png', sizes: '512x512' },
    ],
    shortcut: '/favicon.png',
    apple: '/apple-touch-icon.png',
  },
  title: {
    default: "History Optional: UPSC Notes, PYQs & AI Eval",
    template: "%s | History Optional",
  },
  description: "Free notes, PYQs, historiography & AI answer evaluation for UPSC History Optional. Syllabus-structured, built for Mains.",
  keywords: [
    "UPSC History Optional", "History Optional notes", "History Optional PYQ",
    "UPSC Mains History Optional", "History Optional answer evaluation",
    "UPSC History Optional free notes", "historiography UPSC", "History Optional AI",
    "Ancient India UPSC", "Medieval India UPSC", "Modern India UPSC", "World History UPSC"
  ],
  authors: [{ name: "History Optional" }],
  creator: "History Optional",
  metadataBase: new URL("https://historyoptional.xyz"),
  alternates: { canonical: "https://historyoptional.xyz" },
  verification: { other: { "msvalidate.01": "7B3A67FCFC8829FB6FEB73998D1E0342" } },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://historyoptional.xyz",
    siteName: "History Optional",
    title: "History Optional: UPSC Notes, PYQs & AI Eval",
    description: "Free comprehensive notes, PYQs, historiography, timelines and AI answer evaluation for UPSC History Optional. Built for serious Mains aspirants.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "History Optional — UPSC Mains" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "History Optional: UPSC Notes, PYQs & AI Eval",
    description: "Free comprehensive notes, PYQs, historiography and AI answer evaluation for UPSC History Optional.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // The pre-paint script below stamps data-theme (and lang, for a reader in
    // Hindi mode) on this element before React hydrates, so the server HTML and
    // the live DOM differ by those attributes.
    // suppressHydrationWarning is exactly for that case and is scoped to <html>.
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <head>
        {/*
          Theme init, before paint, so there is no flash of the wrong ground.

          This always stamps data-theme, even when the reader has expressed no
          preference, resolving prefers-color-scheme here rather than in CSS.
          That keeps the stylesheet down to two states: 45 [data-theme="light"]
          rules in globals.css patch inline styles by substring, and a third
          state would mean a second selector on every one of them.

          Paper (light) is the default now that every page is in the design
          system; a reader who chose dark keeps it. The server's HTML carries
          light as well, so a page that loads without the script still has it.
        */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function(){
            try {
              var t = localStorage.getItem('ho-theme');
              if (t !== 'light' && t !== 'dark') t = 'light';
              document.documentElement.setAttribute('data-theme', t);
              if (localStorage.getItem('lang') === 'hi') document.documentElement.setAttribute('lang', 'hi');
            } catch(e) {
              document.documentElement.setAttribute('data-theme', 'light');
            }
          })();
        `}} />
      </head>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "WebSite",
                "@id": "https://historyoptional.xyz/#website",
                "name": "History Optional",
                "url": "https://historyoptional.xyz",
                "description": "Free comprehensive notes, PYQs, historiography and AI answer evaluation for UPSC History Optional",
                "inLanguage": "en-IN",
              },
              {
                "@type": "Organization",
                "@id": "https://historyoptional.xyz/#organization",
                "name": "historyoptional.xyz",
                "url": "https://historyoptional.xyz",
                "logo": {
                  "@type": "ImageObject",
                  "url": "https://historyoptional.xyz/icon-512.png",
                  "width": 512,
                  "height": 512
                },
                "contactPoint": {
                  "@type": "ContactPoint",
                  "email": "historyoptional.xyz@gmail.com",
                  "contactType": "customer support"
                },
                "sameAs": [
                  "https://t.me/historyoptionalxyz"
                ]
              }
            ]
          }) }}
        />
        <LangProvider>
        <WeeklyCheckup />
        <AuthRedirectHandler />
        <VisitorTracker />
        <ProgressSync />
        <PhoneGate />
        <PWARegister />
        <InAppBrowserNotice />
        <PromoPopup />
        <Navbar />
        <Script async src="https://www.googletagmanager.com/gtag/js?id=G-7ZF23N3PZC" strategy="afterInteractive" />
        <Script id="google-analytics" strategy="afterInteractive">{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-7ZF23N3PZC');
        `}</Script>
          {/* Padded by the navbar's height, 60px, so pages start right under it. */}
          <main style={{ minHeight: '100vh', paddingTop: 60 }} className="ho-main">{children}</main>
        <Footer />
        <BottomNav />
        <Toaster />
        <ConfirmHost />
        <Analytics />
        <SpeedInsights />
        </LangProvider>
      </body>
    </html>
  );
}
