import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Answer Evaluation — UPSC History Optional",
  description: "Upload your handwritten UPSC History Optional answer and get instant AI evaluation — section-wise marks, historian feedback, model answer and detailed analysis.",
  alternates: { canonical: "/evaluate" },
  openGraph: {
    title: "AI Answer Evaluation — UPSC History Optional",
    description: "Upload your handwritten UPSC History Optional answer and get instant AI evaluation — section-wise marks, historian feedback, model answer and detailed analysis.",
    url: "https://historyoptional.xyz/evaluate",
  },
  twitter: {
    title: "AI Answer Evaluation — UPSC History Optional",
    description: "Upload your handwritten UPSC History Optional answer and get instant AI evaluation — section-wise marks, historian feedback, model answer and detailed analysis.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
