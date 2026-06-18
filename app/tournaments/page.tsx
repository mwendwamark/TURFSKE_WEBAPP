import type { Metadata } from "next";
import React from "react";
import Navbar from "@/components/navbar/Navbar";

export const metadata: Metadata = {
  title: "Turf Tournaments in Kenya",
  description:
    "Join or host turf tournaments in Kenya. Discover local football competitions, leagues, and events near you.",
  openGraph: {
    title: "Turf Tournaments in Kenya | TurfsKE",
    description:
      "Join or host turf tournaments in Kenya. Discover local football competitions and events near you.",
  },
};

export default function TournamentsPage() {
  return (
    <main>
      <Navbar variant="primary" />
      <div style={{ padding: "12rem 2rem", textAlign: "center", minHeight: "100vh", backgroundColor: "#fafaf9" }}>
        <h1 style={{ fontSize: "3rem", marginBottom: "1rem", color: "#1e1e1e" }}>Turf Tournaments in Kenya</h1>
        <p style={{ color: "#555555" }}>Join or host local competitive events and leagues across Kenya.</p>
      </div>
    </main>
  );
}
