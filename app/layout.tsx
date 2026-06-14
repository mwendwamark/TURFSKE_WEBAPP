import type { Metadata } from "next";
import { Google_Sans_Flex } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const googleSansFlex = Google_Sans_Flex({
  variable: "--font-family",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TURFSKE",
  description: "Easiest way to find and book a turf | Find turfs in Kenya",
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
  ],
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
