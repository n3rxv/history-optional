import type { Metadata } from "next";

const title = "Topper Copies: UPSC History Optional Handwritten Answers";
const description = "Handwritten UPSC History Optional Mains answers by toppers, filed by syllabus topic and linked to the previous year questions they answer.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "https://historyoptional.xyz/topper-copies" },
  openGraph: { title, description, url: "https://historyoptional.xyz/topper-copies" },
  twitter: { title, description },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
