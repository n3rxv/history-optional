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

export const metadata: Metadata = {
  icons: {
    icon: '/favicon.svg',
  },
  title: "History Optional — UPSC Mains",
  description: "Comprehensive notes, PYQs, timelines and AI assistance for UPSC History Optional",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
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
