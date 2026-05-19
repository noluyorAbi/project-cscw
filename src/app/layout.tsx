import type { Metadata, Viewport } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";

// Helvetica is a system font (not a Google webfont) — use a Helvetica stack
const SANS_STACK =
  '"Helvetica Neue", Helvetica, Arial, "Liberation Sans", system-ui, sans-serif';

const mono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const description =
  "A working proof of concept: a phone messenger that ships the sender's facial expression and heart rate with every message. MMI2 SS26 · LMU Munich.";

export const metadata: Metadata = {
  metadataBase: new URL("https://github.com/noluyorAbi/project-cscw"),
  title: {
    default: "Emotion-Aware Chat — MMI2 SS26 PoC",
    template: "%s — Emotion-Aware Chat",
  },
  description,
  applicationName: "Emotion-Aware Chat",
  authors: [{ name: "Alperen Adatepe" }],
  keywords: [
    "HCI",
    "CSCW",
    "affective computing",
    "emotion recognition",
    "rPPG",
    "MMI2",
    "LMU",
  ],
  openGraph: {
    type: "website",
    title: "Emotion-Aware Chat — MMI2 SS26 PoC",
    description,
    siteName: "Emotion-Aware Chat",
  },
  twitter: {
    card: "summary_large_image",
    title: "Emotion-Aware Chat — MMI2 SS26 PoC",
    description,
  },
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#09090b",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${mono.variable} h-full antialiased`}
      style={{ "--font-geist-sans": SANS_STACK } as React.CSSProperties}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
