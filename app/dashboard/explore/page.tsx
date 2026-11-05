import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import Explore from "../../explore/Explore";
import { getExploreData } from "../../explore/data";
import styles from "./ExploreDashboard.module.css";

export default async function DashboardExplorePage() {
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

  if (profile?.role !== "player") {
    redirect("/dashboard");
  }

  const { venues, amenities } = await getExploreData();

  return (
    <div className={styles.embed}>
      <Explore
        venues={venues}
        amenities={amenities}
        venueBasePath="/dashboard/explore"
      />
    </div>
  );
}
