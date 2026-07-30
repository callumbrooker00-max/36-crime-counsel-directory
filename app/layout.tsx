import type { Metadata } from "next";
import { Fraunces, Hanken_Grotesk, IBM_Plex_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/toast";
import "./globals.css";

// Self-hosted at build by next/font — no runtime CDN request (see CLAUDE.md).
// Fraunces: characterful editorial serif for display — headings + the wordmark
// register; the optical-size axis keeps large sizes elegant.
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

// Hanken Grotesk: humanist UI sans — warmer and less templated than Inter.
const hanken = Hanken_Grotesk({
  variable: "--font-hanken",
  subsets: ["latin"],
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "36 Crime Counsel Directory",
  description: "The 36 Group crime team — counsel directory.",
  // Client portal, not the public website: keep it out of search (NFR-11).
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en-GB"
      className={`${fraunces.variable} ${hanken.variable} ${ibmPlexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Toaster>{children}</Toaster>
      </body>
    </html>
  );
}
