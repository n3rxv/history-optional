import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Historiography — UPSC History Optional",
  description: "Complete historiography for UPSC History Optional — key historians, their arguments, debates and how to use them in Mains answers. Ancient, Medieval, Modern India and World History.",
  alternates: { canonical: "/historiography" },
  openGraph: {
    title: "Historiography — UPSC History Optional",
    description: "Complete historiography for UPSC History Optional — key historians, their arguments, debates and how to use them in Mains answers. Ancient, Medieval, Modern India and World History.",
    url: "https://historyoptional.xyz/historiography",
  },
  twitter: {
    title: "Historiography — UPSC History Optional",
    description: "Complete historiography for UPSC History Optional — key historians, their arguments, debates and how to use them in Mains answers. Ancient, Medieval, Modern India and World History.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
