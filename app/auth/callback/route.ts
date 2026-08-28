import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

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

  const user = session.user;

  // Check if this user has a profile with a role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role) {
    // Profile exists — go to dashboard
    return NextResponse.redirect(`${origin}/dashboard`);
  }

  // Google user with no profile yet — the trigger should have fired,
  // but if it did not (Google users can bypass it), send to role selection
  return NextResponse.redirect(`${origin}/auth/select-role`);
}