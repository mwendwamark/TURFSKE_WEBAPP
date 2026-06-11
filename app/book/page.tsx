import React from "react";
import Navbar from "@/components/navbar/Navbar";

export default function BookPage() {
  return (
    <main>
      <Navbar variant="primary" />
      <div style={{ padding: "12rem 2rem", textAlign: "center", minHeight: "100vh", backgroundColor: "#fafaf9" }}>
        <h1 style={{ fontSize: "3rem", marginBottom: "1rem", color: "#1e1e1e" }}>Book a Turf</h1>
        <p style={{ color: "#555555" }}>Select a venue and reserve your slot instantly.</p>
      </div>
    </main>
  );
}
