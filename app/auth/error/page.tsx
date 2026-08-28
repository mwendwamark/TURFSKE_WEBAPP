import Link from "next/link";

export default function AuthErrorPage() {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "var(--font_family)",
      backgroundColor: "var(--off-white)",
      gap: "1rem",
      padding: "2rem",
      textAlign: "center",
    }}>
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--black)" }}>
        Authentication error
      </h1>
      <p style={{ color: "var(--grey)", maxWidth: "36ch" }}>
        Something went wrong during sign in. This can happen if the link
        expired or was already used.
      </p>
      <Link
        href="/auth/login"
        style={{
          marginTop: "0.5rem",
          padding: "0.6rem 1.5rem",
          backgroundColor: "var(--primary_green)",
          color: "#fff",
          borderRadius: "8px",
          fontWeight: 600,
          fontSize: "0.9rem",
        }}
      >
        Back to sign in
      </Link>
    </div>
  );
}