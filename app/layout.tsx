import type { Metadata } from "next";
import { Google_Sans_Flex } from "next/font/google";
import "./globals.css";

const googleSansFlex = Google_Sans_Flex({
  variable: "--font-family",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://turfske.vercel.app"),
  title: {
    default: "TurfsKE — Find & Book the Best Turfs in Kenya",
    template: "%s | TurfsKE",
  },
  description:
    "Easiest way to find and book a turf in Kenya. Browse, compare, and reserve quality pitches near you.",
  keywords: [
    "Turfs in Kenya",
    "Turfs in Nairobi",
    "Turf booking",
    "List your turf",
    "Turf booking app",
    "Turf booking platform",
    "Turf booking system",
    "Turf booking app Kenya",
    "Turf booking platform Kenya",
    "Turf booking system Kenya",
    "football pitches Kenya",
    "sports grounds Kenya",
  ],
  openGraph: {
    title: "TurfsKE — Find & Book Turfs in Kenya",
    description:
      "The easiest way to find and book turfs across Kenya. Browse pitches, compare facilities, and reserve your slot.",
    url: "https://turfske.vercel.app",
    siteName: "TurfsKE",
    locale: "en_KE",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TurfsKE — Find & Book Turfs in Kenya",
    description:
      "The easiest way to find and book turfs across Kenya.",
  },
  verification: {
    google: "hvtvgLUAEEBi-hqFdayn1BtW7uQOORA74u-rJ_xKVu4",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${googleSansFlex.variable} h-full antialiased`}>
      <body className="">{children}</body>
    </html>
  );
}
