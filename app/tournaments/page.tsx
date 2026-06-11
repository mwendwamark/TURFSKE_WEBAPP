import React from "react";
import Navbar from "@/components/navbar/Navbar";

export default function TournamentsPage() {
  return (
    <main>
      <Navbar variant="primary" />
      <div style={{ padding: "12rem 2rem", textAlign: "center", minHeight: "100vh", backgroundColor: "#fafaf9" }}>
        <h1 style={{ fontSize: "3rem", marginBottom: "1rem", color: "#1e1e1e" }}>Tournaments</h1>
        <p style={{ color: "#555555" }}>Join or host local competitive events and leagues.</p>
      </div>
    </main>
  );
}
