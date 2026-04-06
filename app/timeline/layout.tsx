import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "History Timeline — UPSC History Optional",
  description: "Visual chronological timeline for UPSC History Optional — connect events across Ancient, Medieval, Modern India and World History for better answer writing.",
  alternates: { canonical: "/timeline" },
  openGraph: {
    title: "History Timeline — UPSC History Optional",
    description: "Visual chronological timeline for UPSC History Optional — connect events across Ancient, Medieval, Modern India and World History for better answer writing.",
    url: "https://historyoptional.xyz/timeline",
  },
  twitter: {
    title: "History Timeline — UPSC History Optional",
    description: "Visual chronological timeline for UPSC History Optional — connect events across Ancient, Medieval, Modern India and World History for better answer writing.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
