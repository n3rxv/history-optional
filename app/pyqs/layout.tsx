import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Previous Year Questions — UPSC History Optional",
  description: "Topic-wise previous year questions for UPSC History Optional Mains. Organised by syllabus section to help you identify patterns and prepare strategically.",
  alternates: { canonical: "/pyqs" },
  openGraph: {
    title: "Previous Year Questions — UPSC History Optional",
    description: "Topic-wise previous year questions for UPSC History Optional Mains. Organised by syllabus section to help you identify patterns and prepare strategically.",
    url: "https://historyoptional.xyz/pyqs",
  },
  twitter: {
    title: "Previous Year Questions — UPSC History Optional",
    description: "Topic-wise previous year questions for UPSC History Optional Mains. Organised by syllabus section to help you identify patterns and prepare strategically.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
