import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import SettingsForm from "./SettingsForm";

export default async function SettingsPage() {
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
    .select("role, full_name, phone_number")
    .eq("id", user.id)
    .maybeSingle();

  const role = profile?.role ?? "player";
  let businessName: string | null = null;

  if (role === "manager") {
    const { data: managerProfile } = await supabase
      .from("manager_profiles")
      .select("business_name")
      .eq("user_id", user.id)
      .maybeSingle();
    businessName = managerProfile?.business_name ?? null;
  }

  return (
    <SettingsForm
      initial={{
        fullName: profile?.full_name || user.email || "",
        phoneNumber: profile?.phone_number ?? "",
        businessName: businessName ?? "",
      }}
      isManager={role === "manager"}
    />
  );
}