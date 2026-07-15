import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import SignOutButton from "@/components/auth/SignOutButton";
import styles from "./Dashboard.module.css";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If somehow someone reaches here without a session, send them to login
  if (!user) {
    redirect("/auth/login");
  }

  // Fetch profile to get role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .single();

  const role      = profile?.role ?? "player";
  const fullName  = profile?.full_name ?? user.email;

  return (
    <div className={styles.dashboard_page}>
      <div className={styles.dashboard_card}>

        {/* Header */}
        <div className={styles.dashboard_header}>
          <span className="auth_logo">TURFSKE</span>
          <SignOutButton />
        </div>

        {/* Welcome */}
        <div className={styles.dashboard_welcome}>
          <p className={styles.dashboard_role_badge}>
            {role === "manager" ? "🏟️ Turf Manager" : "🏃 Player"}
          </p>
          <h1 className={styles.dashboard_title}>Welcome, {fullName}</h1>
          <p className={styles.dashboard_sub}>
            You are signed in as <strong>{user.email}</strong>
          </p>
        </div>

        {/* Info tiles */}
        <div className={styles.dashboard_tiles}>
          <div className={styles.dashboard_tile}>
            <span className={styles.dashboard_tile_label}>Account ID</span>
            <span className={styles.dashboard_tile_value}>{user.id.slice(0, 8)}...</span>
          </div>
          <div className={styles.dashboard_tile}>
            <span className={styles.dashboard_tile_label}>Role</span>
            <span className={styles.dashboard_tile_value} style={{ textTransform: "capitalize" }}>
              {role}
            </span>
          </div>
          <div className={styles.dashboard_tile}>
            <span className={styles.dashboard_tile_label}>Email confirmed</span>
            <span className={styles.dashboard_tile_value}>
              {user.email_confirmed_at ? "✅ Yes" : "⏳ Pending"}
            </span>
          </div>
          <div className={styles.dashboard_tile}>
            <span className={styles.dashboard_tile_label}>Joined</span>
            <span className={styles.dashboard_tile_value}>
              {new Date(user.created_at).toLocaleDateString("en-KE", {
                day:   "numeric",
                month: "short",
                year:  "numeric",
              })}
            </span>
          </div>
        </div>

        <p className={styles.dashboard_note}>
          This is a temporary dashboard. The full{" "}
          {role === "manager" ? "manager" : "player"} experience is coming soon.
        </p>

      </div>
    </div>
  );
}