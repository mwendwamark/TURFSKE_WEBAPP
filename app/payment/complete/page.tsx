import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import Navbar from "@/components/navbar/Navbar";
import Button from "@/components/ui/buttons/Button";
import { PaymentStatus } from "./PaymentStatus";

export default async function PaymentCompletePage({
  searchParams,
}: {
  searchParams: Promise<{ reference?: string; trxref?: string }>;
}) {
  const params = await searchParams;
  const reference = params.reference ?? params.trxref;

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  if (!reference) {
    return (
      <main>
        <Navbar variant="secondary" />
        <div className="section container">
          <p>Nothing to show here.</p>
          <Button variant="outline" href="/explore">
            Back to Explore
          </Button>
        </div>
      </main>
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <main>
      <Navbar variant="secondary" />
      <PaymentStatus
        reference={reference}
        payerName={profile?.full_name ?? null}
        payerEmail={user.email ?? null}
      />
    </main>
  );
}