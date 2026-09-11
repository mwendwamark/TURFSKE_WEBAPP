import type { Metadata } from "next";
import React from "react";
import Home from "@/app/_home/page";
import Footer from "@/components/footer/Footer";

export const metadata: Metadata = {
  description:
    "Find and book the best turfs in Kenya. TurfsKE connects players with quality football pitches across Nairobi and beyond.",
  openGraph: {
    title: "TurfsKE — Find & Book the Best Turfs in Kenya",
    description:
      "Find and book the best turfs in Kenya. TurfsKE connects players with quality football pitches across Nairobi and beyond.",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "TurfsKE",
  url: "https://turfske.co.ke",
  description:
    "TurfsKE is Kenya's turf booking platform, connecting players with quality football pitches across the country.",
  email: "hello@turfske.com",
  sameAs: [
    "https://facebook.com",
    "https://instagram.com",
    "https://x.com",
    "https://youtube.com",
  ],
};

const page = () => {
  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <Home />
      <Footer/>
    </main>
  );
};

export default page;
