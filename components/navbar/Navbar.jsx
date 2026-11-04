import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import NavbarClient from "./NavbarClient";

export default async function Navbar({ variant = "primary" }) {
  const supabase = createClient(await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return <NavbarClient variant={variant} isSignedIn={Boolean(user)} />;
}
