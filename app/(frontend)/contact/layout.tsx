import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { absolute: "Contact: History Optional" },
  description: "Write to History Optional about a bug, a payment, or an idea for the site.",
  alternates: { canonical: "https://historyoptional.xyz/contact" },
  openGraph: {
    title: "Contact: History Optional",
    description: "Write to History Optional about a bug, a payment, or an idea for the site.",
    url: "https://historyoptional.xyz/contact",
  },
  twitter: {
    title: "Contact: History Optional",
    description: "Write to History Optional about a bug, a payment, or an idea for the site.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
