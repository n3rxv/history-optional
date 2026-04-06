import '@fontsource/libre-baskerville/400.css';
import '@fontsource/libre-baskerville/400-italic.css';
import '@fontsource/libre-baskerville/700.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/600.css';
import type { Metadata } from "next";
import "./globals.css";
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AuthGuard from "@/components/AuthGuard";
import WeeklyCheckup from "@/components/WeeklyCheckup";

export const metadata: Metadata = {
  icons: { icon: '/favicon.svg' },
  title: {
    default: "History Optional — Free UPSC Mains Notes, PYQs & AI Evaluation",
    template: "%s | History Optional",
  },
  description: "Free comprehensive notes, previous year questions, historiography, timelines and AI answer evaluation for UPSC History Optional. Structured by syllabus, built for Mains.",
  keywords: [
    "UPSC History Optional", "History Optional notes", "History Optional PYQ",
    "UPSC Mains History Optional", "History Optional answer evaluation",
    "UPSC History Optional free notes", "historiography UPSC", "History Optional AI",
    "Ancient India UPSC", "Medieval India UPSC", "Modern India UPSC", "World History UPSC"
  ],
  authors: [{ name: "History Optional" }],
  creator: "History Optional",
  metadataBase: new URL("https://historyoptional.xyz"),
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "https://historyoptional.xyz",
    siteName: "History Optional",
    title: "History Optional — Free UPSC Mains Notes, PYQs & AI Evaluation",
    description: "Free comprehensive notes, PYQs, historiography, timelines and AI answer evaluation for UPSC History Optional. Built for serious Mains aspirants.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "History Optional — UPSC Mains" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "History Optional — Free UPSC Mains Notes, PYQs & AI Evaluation",
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
    <html lang="en">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "History Optional",
            "url": "https://historyoptional.xyz",
            "description": "Free comprehensive notes, PYQs, historiography and AI answer evaluation for UPSC History Optional",
          }) }}
        />
        <WeeklyCheckup />
        <Navbar />
        <AuthGuard>
          <main style={{ minHeight: '100vh' }}>{children}</main>
        </AuthGuard>
        <Footer />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
