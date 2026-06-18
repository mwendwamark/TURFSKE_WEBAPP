import type { Metadata } from "next";
import React from "react";
import Home from "@/app/_home/page";

export const metadata: Metadata = {
  description:
    "Find and book the best turfs in Kenya. TurfsKE connects players with quality football pitches across Nairobi and beyond.",
  openGraph: {
    title: "TurfsKE — Find & Book the Best Turfs in Kenya",
    description:
      "Find and book the best turfs in Kenya. TurfsKE connects players with quality football pitches across Nairobi and beyond.",
  },
};

const page = () => {
  return (
    <main>
      <Home />
    </main>
  );
};

export default page;
