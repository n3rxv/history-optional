import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact — History Optional",
  description: "Get in touch with History Optional — feedback, suggestions or queries about the platform.",
  alternates: { canonical: "/contact" },
  openGraph: {
    title: "Contact — History Optional",
    description: "Get in touch with History Optional — feedback, suggestions or queries about the platform.",
    url: "https://historyoptional.xyz/contact",
  },
  twitter: {
    title: "Contact — History Optional",
    description: "Get in touch with History Optional — feedback, suggestions or queries about the platform.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
