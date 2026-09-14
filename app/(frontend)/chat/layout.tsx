import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI History Assistant — UPSC History Optional",
  description: "Ask any UPSC History Optional question and get structured, syllabus-aware answers with historian citations and relevant arguments for Mains.",
  alternates: { canonical: "/chat" },
  openGraph: {
    title: "AI History Assistant — UPSC History Optional",
    description: "Ask any UPSC History Optional question and get structured, syllabus-aware answers with historian citations and relevant arguments for Mains.",
    url: "https://historyoptional.xyz/chat",
  },
  twitter: {
    title: "AI History Assistant — UPSC History Optional",
    description: "Ask any UPSC History Optional question and get structured, syllabus-aware answers with historian citations and relevant arguments for Mains.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
