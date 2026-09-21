import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import ComingSoon from "../../ComingSoon";

export default async function AdminManagersPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") {
    redirect("/dashboard");
  }

  return (
    <ComingSoon
      title="Managers"
      description="Manager moderation is coming soon. This area will list all turf managers for review."
    />
  );
}