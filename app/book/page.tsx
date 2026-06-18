import type { Metadata } from "next";
import React from "react";
import Navbar from "@/components/navbar/Navbar";

export const metadata: Metadata = {
  title: "Book a Turf in Kenya",
  description:
    "Find and book a turf in Kenya. Browse available football pitches, compare facilities, and reserve your slot in seconds.",
  openGraph: {
    title: "Book a Turf in Kenya | TurfsKE",
    description:
      "Find and book a turf in Kenya. Browse available football pitches and reserve your slot.",
  },
};

export default function BookPage() {
  return (
    <main>
      <Navbar variant="primary" />
      <div style={{ padding: "12rem 2rem", textAlign: "center", minHeight: "100vh", backgroundColor: "#fafaf9" }}>
        <h1 style={{ fontSize: "3rem", marginBottom: "1rem", color: "#1e1e1e" }}>Book a Turf in Kenya</h1>
        <p style={{ color: "#555555" }}>Find and reserve your slot at top turfs across Kenya.</p>
      </div>
    </main>
  );
}
