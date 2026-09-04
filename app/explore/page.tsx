import type { Metadata } from "next";
import React from "react";
import Navbar from "@/components/navbar/Navbar";
import Explore from "./Explore";

export const metadata: Metadata = {
  title: "Explore Turfs in Kenya",
  description:
    "Explore the best turfs in Kenya. Compare football pitches by location, surface type, and price. Find the perfect pitch near you.",
  openGraph: {
    title: "Explore Turfs in Kenya | TurfsKE",
    description:
      "Explore the best turfs in Kenya. Compare football pitches by location, surface type, and price.",
  },
};

export default function ExplorePage() {
  return (
    <main>
      <Navbar variant="secondary" />
      {/* <div style={{ padding: "12rem 2rem", textAlign: "center", minHeight: "100vh", backgroundColor: "#fafaf9" }}>
        <h1 style={{ fontSize: "3rem", marginBottom: "1rem", color: "#1e1e1e" }}>Explore Turfs in Kenya</h1>
        <p style={{ color: "#555555" }}>Discover and compare quality pitches near you.</p>
      </div> */}
      <Explore/>
    </main>
  );
}
