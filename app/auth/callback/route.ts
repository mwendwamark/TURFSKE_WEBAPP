import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { isProfileRole, upsertProfile } from "@/utils/auth/profile";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");
  const intendedRole = searchParams.get("intended_role");

  if (!code) {
    return NextResponse.redirect(`${origin}/auth/error`);
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );

  const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !session) {
    console.error("Callback error:", error?.message);
    return NextResponse.redirect(`${origin}/auth/error`);
  }

  // Password-recovery flow — forgotPassword sends users here with
  // ?next=/auth/reset-password. Only allow internal paths (open-redirect guard).
  if (next && next.startsWith("/") && !next.startsWith("//")) {
    return NextResponse.redirect(`${origin}${next}`);
  }

  const user = session.user;

  // The signup page carries a selected role through the OAuth redirect as
  // ?intended_role=player|manager. Absent on the login page / bare Google sign-in.
  const roleRequested = isProfileRole(intendedRole) ? intendedRole : null;

  // Existing profile — this is the single source of truth for the user's role.
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const existingRole = profile?.role;

  // CASE: no profile yet
  if (!existingRole) {
    // Intent known (signup role toggle) — create the profile with that role
    // and take them straight to the dashboard. No second role prompt needed.
    if (roleRequested) {
      const { error: upsertError } = await upsertProfile(supabase, user.id, roleRequested, user);

      if (upsertError) {
        console.error("Callback profile upsert error:", upsertError.message);
        return NextResponse.redirect(`${origin}/auth/error`);
      }

      return NextResponse.redirect(`${origin}/dashboard`);
    }

    // No role context (e.g. login page's Google button) — ask for their intent.
    return NextResponse.redirect(`${origin}/auth/select-role`);
  }

  // CASE: profile exists — plain login (no intended role). Just go to dashboard.
  if (!roleRequested) {
    return NextResponse.redirect(`${origin}/dashboard`);
  }

  // Intended role matches the existing profile — a returning user
  // re-authenticating via Google with the same role. Nothing to explain.
  if (roleRequested === existingRole) {
    return NextResponse.redirect(`${origin}/dashboard`);
  }

  // Intended role conflicts with the existing profile (one email, two roles).
  // Never invent a second role for the same account — sign in with the existing
  // role and let the dashboard explain what happened.
  const notice =
    existingRole === "manager" ? "existing_role_manager" : "existing_role_player";

  return NextResponse.redirect(`${origin}/dashboard?role_notice=${notice}`);
}