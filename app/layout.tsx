import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next"
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TurfsKe",
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
  ]
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="">{children}</body>
    </html>
  );
}
