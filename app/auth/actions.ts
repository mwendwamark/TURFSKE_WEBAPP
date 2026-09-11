"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isProfileRole } from "@/utils/auth/profile";

async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    },
  );
}

// ── Sign in with Google
// Server actions passed to <form action> receive the form's FormData, so the
// signup page can carry its selected role through as a hidden input. The login
// page's Google button submits no intended_role — logging in never implies
// choosing a new role.
export async function signInWithGoogle(formData?: FormData): Promise<void> {
  const supabase = await createClient();

  const intendedRole = formData?.get("intended_role");
  const role = isProfileRole(intendedRole) ? intendedRole : null;

  // Carry the chosen role through the OAuth redirect so the callback knows the
  // user's intent (e.g. /auth/callback?intended_role=player).
  const callbackUrl = role
    ? `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?intended_role=${role}`
    : `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: callbackUrl,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  if (error || !data.url) {
    // OAuth failed or produced no URL — send them to the error page instead
    // of surfacing an unhandled exception.
    redirect("/auth/error");
  }

  // data.url is the Google OAuth URL — redirect the user there
  redirect(data.url);
}

export async function signUp(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("full_name") as string;
  const role = formData.get("role") as "player" | "manager";

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, role },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  });

  if (error) {
    if (
      error.message.toLowerCase().includes("already registered") ||
      error.message.toLowerCase().includes("already been registered") ||
      error.message.toLowerCase().includes("user already exists")
    ) {
      return {
        error:
          "This email is already registered. Please sign in instead — if you used Google, click 'Continue with Google'.",
      };
    }
    return { error: error.message };
  }

  // Existing email — identities array is empty
  if (data?.user && data.user.identities?.length === 0) {
    return {
      error:
        "This email is already registered. Please sign in instead — if you signed up with Google, click 'Continue with Google'.",
    };
  }

  if (data?.user && !data.session) {
    return {
      success:
        "Account created! Check your email and click the confirmation link to continue.",
    };
  }

  return { success: "Account created successfully!" };
}

// ── Sign In
export async function signIn(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  redirect("/dashboard");
}

// ── Sign Out
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/auth/signup");
}

// ── Forgot Password — sends reset email
export async function forgotPassword(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/auth/reset-password`,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: "Password reset link sent. Check your email." };
}

// ── Reset Password — called after clicking the email link
export async function resetPassword(formData: FormData) {
  const supabase = await createClient();

  const password = formData.get("password") as string;

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { error: error.message };
  }

  // End the recovery-flow session — the user must sign in explicitly
  // with their new password before reaching the dashboard.
  await supabase.auth.signOut();

  redirect("/auth/login?reset=success");
}
