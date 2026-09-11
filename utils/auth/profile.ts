import type { SupabaseClient } from "@supabase/supabase-js";

export type ProfileRole = "player" | "manager";

type RoleUser = {
  email?: string | null;
  user_metadata?: {
    full_name?: string | null;
    [key: string]: unknown;
  } | null;
};

// Single source of truth for writing a role onto a new profile row.
// Shared by /api/auth/set-role and the Google OAuth callback.
export async function upsertProfile(
  supabase: SupabaseClient,
  userId: string,
  role: ProfileRole,
  user?: RoleUser | null,
) {
  return supabase.from("profiles").upsert({
    id: userId,
    role,
    full_name:
      user?.user_metadata?.full_name ??
      user?.email?.split("@")[0] ??
      "",
  });
}

export function isProfileRole(value: unknown): value is ProfileRole {
  return value === "player" || value === "manager";
}