"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

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
    }
  );
}

// ── Sign Up
// export async function signUp(formData: FormData) {
//   const supabase = await createClient();

//   const email = formData.get("email") as string;
//   const password = formData.get("password") as string;
//   const fullName = formData.get("full_name") as string;
//   const role = formData.get("role") as "player" | "manager";

//   const { error } = await supabase.auth.signUp({
//     email,
//     password,
//     options: {
//       data: {
//         full_name: fullName,
//         role,
//       },
//       emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
//     },
//   });

//   if (error) {
//     return { error: error.message };
//   }

//   return { success: "Check your email to confirm your account." };
// }
export async function signUp(formData: FormData) {
  const supabase = await createClient();

  const email    = formData.get("email")     as string;
  const password = formData.get("password")  as string;
  const fullName = formData.get("full_name") as string;
  const role     = formData.get("role")      as "player" | "manager";

  // Pre-check: look up the email in the profiles table before attempting signup.
  // We cannot query auth.users directly from the client (RLS blocks it),
  // but we can check our own profiles table which has the user's email
  // via a join, OR we rely on the identities trick below.
  // The identities array is the cleanest client-safe approach.

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role,
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  });

  // Supabase returns an explicit error for some cases (e.g. weak password)
  if (error) {
    // Map common Supabase error messages to friendlier ones
    if (error.message.toLowerCase().includes("already registered") ||
        error.message.toLowerCase().includes("already been registered") ||
        error.message.toLowerCase().includes("user already exists")) {
      return { error: "This email is already in use. Please sign in instead." };
    }
    return { error: error.message };
  }

  // When email confirmation is ON, Supabase silently "succeeds" for existing
  // emails but returns a user with an empty identities array.
  // This is the standard detection method recommended by Supabase.
  if (data?.user && data.user.identities && data.user.identities.length === 0) {
    return {
      error: "This email is already registered. Please sign in or reset your password.",
    };
  }

  // Genuine new signup — user needs to confirm their email
  if (data?.user && !data.session) {
    return {
      success: "Account created! Check your email and click the confirmation link to continue.",
    };
  }

  // Email confirmation is OFF — user is signed in immediately
  if (data?.session) {
    return { success: "Account created successfully! You are now signed in." };
  }

  return { success: "Check your email to confirm your account." };
}

// ── Sign In
export async function signIn(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { data, error } = await supabase.auth.signInWithPassword({
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
  redirect("/");
}

// ── Forgot Password — sends reset email
export async function forgotPassword(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password`,
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

  redirect("/dashboard");
}