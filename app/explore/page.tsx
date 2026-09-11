import type { Metadata } from "next";
import React from "react";
import Navbar from "@/components/navbar/Navbar";
import Explore from "./Explore";

export const metadata: Metadata = {
  title: "Browse Football Turfs in Kenya",
  description:
    "Browse and compare football turfs across Kenya. Filter by location, pitch size, surface type, and price. Find available slots near you on TurfsKE.",
  openGraph: {
    title: "Browse Football Turfs in Kenya | TurfsKE",
    description:
      "Browse and compare football turfs across Kenya. Filter by location, pitch size, surface type, and price.",
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
