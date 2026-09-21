import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import DashboardShell from "./DashboardShell";
import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If somehow someone reaches here without a session, send them to login
  if (!user) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .maybeSingle();

  const role = profile?.role ?? "player";
  const fullName = profile?.full_name || user.email || "Player";

  return (
    <DashboardShell user={{ fullName, email: user.email ?? "", role }}>
      {children}
    </DashboardShell>
  );
}