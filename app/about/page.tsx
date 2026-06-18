import type { Metadata } from "next";
import React from "react";
import Navbar from "@/components/navbar/Navbar";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn about TurfsKE — Kenya's #1 platform for finding and booking quality turfs. We connect players with sports facilities across the country.",
  openGraph: {
    title: "About TurfsKE",
    description:
      "Learn about TurfsKE — Kenya's #1 platform for finding and booking quality turfs.",
  },
};

export default function AboutPage() {
  return (
    <main>
      <Navbar variant="primary" />
      <div style={{ padding: "12rem 2rem", textAlign: "center", minHeight: "100vh", backgroundColor: "#fafaf9" }}>
        <h1 style={{ fontSize: "3rem", marginBottom: "1rem", color: "#1e1e1e" }}>About TurfsKE — Kenya&apos;s Turf Booking Platform</h1>
        <p style={{ color: "#555555" }}>Connecting sports facility managers and players across Kenya.</p>
      </div>
    </main>
  );
}
