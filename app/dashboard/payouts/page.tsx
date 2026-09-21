import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import PayoutsClient from "./PayoutsClient";
import type { PayoutStatus } from "../types";

export default async function PayoutsPage() {
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

  if (profile?.role !== "manager") {
    redirect("/dashboard");
  }

  const { data: managerProfile } = await supabase
    .from("manager_profiles")
    .select("business_name, paystack_subaccount_code, verified")
    .eq("user_id", user.id)
    .maybeSingle();

  const payout: PayoutStatus = {
    businessName: managerProfile?.business_name ?? null,
    paystackSubaccountCode: managerProfile?.paystack_subaccount_code ?? null,
    verified: managerProfile?.verified ?? null,
  };

  return <PayoutsClient payout={payout} />;
}