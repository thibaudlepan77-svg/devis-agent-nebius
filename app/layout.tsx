import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", display: "swap" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

const title = "Devis Agent, sourced quotes from a one-line request";
const description =
  "An agent that researches the market with Tavily, drafts the scope with NVIDIA Nemotron on Nebius Token Factory, and prices it with arithmetic you can check.";

export const metadata: Metadata = {
  metadataBase: new URL("https://devis-agent-nebius.vercel.app"),
  title,
  description,
  applicationName: "Devis Agent",
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Devis Agent",
    title,
    description,
    locale: "en_US",
  },
  twitter: { card: "summary_large_image", title, description },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f1e8" },
    { media: "(prefers-color-scheme: dark)", color: "#12110e" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable}`}>
      <body>{children}</body>
    </html>
  );
}
