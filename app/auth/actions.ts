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
    },
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

// ── Sign in with Google
export async function signInWithGoogle(): Promise<void> {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  // data.url is the Google OAuth URL — redirect the user there
  if (data.url) {
    redirect(data.url);
  }
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
