import type { Metadata } from "next";
import { Spectral, Inter, IBM_Plex_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/toast";
import "./globals.css";

// Self-hosted at build by next/font — no runtime CDN request (see CLAUDE.md).
const spectral = Spectral({
  variable: "--font-spectral",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
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
      className={`${spectral.variable} ${inter.variable} ${ibmPlexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Toaster>{children}</Toaster>
      </body>
    </html>
  );
}
