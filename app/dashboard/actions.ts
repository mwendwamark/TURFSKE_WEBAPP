"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import type {
  ActionResult,
  ActionResultWithData,
  BankOption,
} from "./types";

const PAYSTACK_API = "https://api.paystack.co";

// Platform commission (percentage) taken by TurfsKE on each Paystack split
// transaction — the remainder settles to the manager. 5% matches the figure
// currently documented in Project.md, which is still listed there as "to be
// finalized". Confirmed by Nthei before relying on this value.
const PAYSTACK_PLATFORM_PERCENTAGE = 5;

const IMAGE_BUCKET = "venue-media";

type StorageImage = { storagePath: string; position: number };

async function getSession() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return { supabase, user: null };
  return { supabase, user: data.user };
}

async function isManagerProfile(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  return data?.role === "manager";
}

// ── Venues ────────────────────────────────────────────────

export type VenueFormInput = {
  name: string;
  addressText: string;
  latitude: string;
  longitude: string;
  amenityIds: string[];
};

export async function createVenueAction(
  input: VenueFormInput,
): Promise<ActionResultWithData<{ venueId: string }>> {
  const { supabase, user } = await getSession();
  if (!user) return { success: false, error: "Please sign in to continue." };

  const manager = await isManagerProfile(supabase, user.id);
  if (!manager) {
    return { success: false, error: "Only turf managers can add venues." };
  }

  const name = input.name.trim();
  if (!name) {
    return { success: false, error: "Please give your venue a name." };
  }

  const latitude = cleanCoordinate(input.latitude, 90, -90);
  const longitude = cleanCoordinate(input.longitude, 180, -180);
  if (latitude === null || longitude === null) {
    return { success: false, error: "Coordinates look off — lat must be between -90 and 90, long between -180 and 180." };
  }

  const { data: venue, error: insertError } = await supabase
    .from("venues")
    .insert({
      manager_id: user.id,
      name,
      address_text: input.addressText.trim() || null,
      latitude,
      longitude,
    })
    .select("id")
    .single();

  if (insertError || !venue) {
    return { success: false, error: "We couldn't save your venue. Please try again." };
  }

  const amenityError = await syncVenueAmenities(supabase, venue.id, input.amenityIds);
  if (amenityError) {
    return { success: false, error: amenityError };
  }

  revalidatePath("/dashboard");
  return { success: true, data: { venueId: venue.id } };
}

export async function updateVenueAction(
  venueId: string,
  input: VenueFormInput,
): Promise<ActionResult> {
  const { supabase, user } = await getSession();
  if (!user) return { success: false, error: "Please sign in to continue." };

  if (!(await venueBelongsToManager(supabase, venueId, user.id))) {
    return { success: false, error: "We couldn't find that venue. It may have been removed." };
  }

  const name = input.name.trim();
  if (!name) return { success: false, error: "Please give your venue a name." };

  const latitude = cleanCoordinate(input.latitude, 90, -90);
  const longitude = cleanCoordinate(input.longitude, 180, -180);
  if (latitude === null || longitude === null) {
    return { success: false, error: "Coordinates look off — lat must be between -90 and 90, long between -180 and 180." };
  }

  const { error: updateError } = await supabase
    .from("venues")
    .update({
      name,
      address_text: input.addressText.trim() || null,
      latitude,
      longitude,
    })
    .eq("id", venueId);

  if (updateError) {
    return { success: false, error: "We couldn't update your venue. Please try again." };
  }

  // Diff the amenity selections against existing venue_amenities rows:
  // add what was checked, remove what was unchecked.
  const { data: existing } = await supabase
    .from("venue_amenities")
    .select("amenity_id")
    .eq("venue_id", venueId);

  const existingIds = (existing ?? []).map((row) => row.amenity_id);
  const toRemove = existingIds.filter((id) => !input.amenityIds.includes(id));
  const toAdd = input.amenityIds.filter((id) => !existingIds.includes(id));

  if (toRemove.length > 0) {
    const { error: deleteError } = await supabase
      .from("venue_amenities")
      .delete()
      .eq("venue_id", venueId)
      .in("amenity_id", toRemove);

    if (deleteError) {
      return { success: false, error: "We couldn't update the venue's amenities. Please try again." };
    }
  }

  if (toAdd.length > 0) {
    const { error: insertError } = await supabase
      .from("venue_amenities")
      .insert(toAdd.map((amenityId) => ({ venue_id: venueId, amenity_id: amenityId })));

    if (insertError) {
      return { success: false, error: "We couldn't update the venue's amenities. Please try again." };
    }
  }

  revalidatePath("/dashboard");
  return { success: true };
}

async function syncVenueAmenities(
  supabase: Awaited<ReturnType<typeof createClient>>,
  venueId: string,
  amenityIds: string[],
): Promise<string | null> {
  if (amenityIds.length === 0) return null;

  const { error } = await supabase.from("venue_amenities").insert(
    amenityIds.map((amenityId) => ({ venue_id: venueId, amenity_id: amenityId })),
  );

  return error ? "We couldn't save the venue's amenities. Please try again." : null;
}

// ── Pitches ───────────────────────────────────────────────

export type PitchFormInput = {
  name: string;
  sportType: string;
  size: string;
  pricePerHour: string;
  surfaceType: string;
  status: string;
};

export async function createPitchAction(
  venueId: string,
  input: PitchFormInput,
): Promise<ActionResultWithData<{ pitchId: string }>> {
  const { supabase, user } = await getSession();
  if (!user) return { success: false, error: "Please sign in to continue." };

  if (!(await venueBelongsToManager(supabase, venueId, user.id))) {
    return { success: false, error: "We couldn't find that venue. It may have been removed." };
  }

  const name = input.name.trim();
  if (!name) return { success: false, error: "Please give your pitch a name." };

  const price = cleanPrice(input.pricePerHour);
  if (price === null) {
    return { success: false, error: "Please enter a valid price per hour." };
  }

  const status = input.status === "inactive" ? "inactive" : "active";

  const { data: pitch, error } = await supabase
    .from("pitches")
    .insert({
      venue_id: venueId,
      name,
      sport_type: input.sportType.trim() || "football",
      size: input.size || null,
      price_per_hour: price,
      surface_type: input.surfaceType.trim() || null,
      status,
    })
    .select("id")
    .single();

  if (error || !pitch) {
    return { success: false, error: "We couldn't save your pitch. Please try again." };
  }

  revalidatePath("/dashboard");
  return { success: true, data: { pitchId: pitch.id } };
}

export async function updatePitchAction(
  pitchId: string,
  input: PitchFormInput,
): Promise<ActionResult> {
  const { supabase, user } = await getSession();
  if (!user) return { success: false, error: "Please sign in to continue." };

  const { data: pitch } = await supabase
    .from("pitches")
    .select("venue_id")
    .eq("id", pitchId)
    .maybeSingle();

  if (!pitch || !(await venueBelongsToManager(supabase, pitch.venue_id, user.id))) {
    return { success: false, error: "We couldn't find that pitch. It may have been removed." };
  }

  const name = input.name.trim();
  if (!name) return { success: false, error: "Please give your pitch a name." };

  const price = cleanPrice(input.pricePerHour);
  if (price === null) {
    return { success: false, error: "Please enter a valid price per hour." };
  }

  const status = input.status === "inactive" ? "inactive" : "active";

  const { error } = await supabase
    .from("pitches")
    .update({
      name,
      sport_type: input.sportType.trim() || "football",
      size: input.size || null,
      price_per_hour: price,
      surface_type: input.surfaceType.trim() || null,
      status,
    })
    .eq("id", pitchId);

  if (error) {
    return { success: false, error: "We couldn't update your pitch. Please try again." };
  }

  revalidatePath("/dashboard");
  return { success: true };
}

// ── Venue & pitch images ──────────────────────────────────
// Uploads happen client-side (server actions have a 1MB body size limit),
// so these actions only insert/remove DB rows for already-stored objects.

export async function attachVenueImagesAction(
  venueId: string,
  images: StorageImage[],
): Promise<ActionResult> {
  const { supabase, user } = await getSession();
  if (!user) return { success: false, error: "Please sign in to continue." };

  if (!(await venueBelongsToManager(supabase, venueId, user.id))) {
    return { success: false, error: "We couldn't find that venue. It may have been removed." };
  }

  const valid = images
    .filter(({ storagePath }) => storagePath.startsWith(`${venueId}/venue/`))
    .map(({ storagePath, position }) => ({ venue_id: venueId, storage_path: storagePath, position }));

  if (valid.length === 0 && images.length > 0) {
    return { success: false, error: "One or more images weren't in the right location and couldn't be saved." };
  }

  if (valid.length > 0) {
    const { error } = await supabase.from("venue_images").insert(valid);
    if (error) {
      return { success: false, error: "We couldn't save those images. Please try again." };
    }
  }

  revalidatePath("/dashboard");
  return { success: true };
}

export async function attachPitchImagesAction(
  pitchId: string,
  images: StorageImage[],
): Promise<ActionResult> {
  const { supabase, user } = await getSession();
  if (!user) return { success: false, error: "Please sign in to continue." };

  const venueId = await venueIdForPitch(supabase, pitchId);
  if (!venueId || !(await venueBelongsToManager(supabase, venueId, user.id))) {
    return { success: false, error: "We couldn't find that pitch. It may have been removed." };
  }

  const prefix = `${venueId}/pitches/${pitchId}/`;
  const valid = images
    .filter(({ storagePath }) => storagePath.startsWith(prefix))
    .map(({ storagePath, position }) => ({ pitch_id: pitchId, storage_path: storagePath, position }));

  if (valid.length === 0 && images.length > 0) {
    return { success: false, error: "One or more images weren't in the right location and couldn't be saved." };
  }

  if (valid.length > 0) {
    const { error } = await supabase.from("pitch_images").insert(valid);
    if (error) {
      return { success: false, error: "We couldn't save those images. Please try again." };
    }
  }

  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteVenueImageAction(
  venueId: string,
  image: { id: string; storagePath: string },
): Promise<ActionResult> {
  const { supabase, user } = await getSession();
  if (!user) return { success: false, error: "Please sign in to continue." };

  if (!(await venueBelongsToManager(supabase, venueId, user.id))) {
    return { success: false, error: "We couldn't find that venue. It may have been removed." };
  }

  if (!image.storagePath.startsWith(`${venueId}/venue/`)) {
    return { success: false, error: "That image couldn't be removed because its location isn't valid." };
  }

  await supabase.storage.from(IMAGE_BUCKET).remove([image.storagePath]);

  const { error } = await supabase
    .from("venue_images")
    .delete()
    .eq("id", image.id)
    .eq("venue_id", venueId);

  if (error) {
    return { success: false, error: "We couldn't remove that image. Please try again." };
  }

  revalidatePath("/dashboard");
  return { success: true };
}

export async function deletePitchImageAction(
  pitchId: string,
  image: { id: string; storagePath: string },
): Promise<ActionResult> {
  const { supabase, user } = await getSession();
  if (!user) return { success: false, error: "Please sign in to continue." };

  const venueId = await venueIdForPitch(supabase, pitchId);
  if (!venueId || !(await venueBelongsToManager(supabase, venueId, user.id))) {
    return { success: false, error: "We couldn't find that pitch. It may have been removed." };
  }

  if (!image.storagePath.startsWith(`${venueId}/pitches/${pitchId}/`)) {
    return { success: false, error: "That image couldn't be removed because its location isn't valid." };
  }

  await supabase.storage.from(IMAGE_BUCKET).remove([image.storagePath]);

  const { error } = await supabase
    .from("pitch_images")
    .delete()
    .eq("id", image.id)
    .eq("pitch_id", pitchId);

  if (error) {
    return { success: false, error: "We couldn't remove that image. Please try again." };
  }

  revalidatePath("/dashboard");
  return { success: true };
}

export async function reorderVenueImagesAction(
  venueId: string,
  orderedIds: string[],
): Promise<ActionResult> {
  const { supabase, user } = await getSession();
  if (!user) return { success: false, error: "Please sign in to continue." };

  if (!(await venueBelongsToManager(supabase, venueId, user.id))) {
    return { success: false, error: "We couldn't find that venue. It may have been removed." };
  }

  const updates = orderedIds.map((id, index) =>
    supabase.from("venue_images").update({ position: index }).eq("id", id).eq("venue_id", venueId),
  );

  const results = await Promise.all(updates);
  if (results.some((r) => r.error)) {
    return { success: false, error: "We couldn't reorder those images. Please try again." };
  }

  revalidatePath("/dashboard");
  return { success: true };
}

export async function reorderPitchImagesAction(
  pitchId: string,
  orderedIds: string[],
): Promise<ActionResult> {
  const { supabase, user } = await getSession();
  if (!user) return { success: false, error: "Please sign in to continue." };

  const venueId = await venueIdForPitch(supabase, pitchId);
  if (!venueId || !(await venueBelongsToManager(supabase, venueId, user.id))) {
    return { success: false, error: "We couldn't find that pitch. It may have been removed." };
  }

  const updates = orderedIds.map((id, index) =>
    supabase.from("pitch_images").update({ position: index }).eq("id", id).eq("pitch_id", pitchId),
  );

  const results = await Promise.all(updates);
  if (results.some((r) => r.error)) {
    return { success: false, error: "We couldn't reorder those images. Please try again." };
  }

  revalidatePath("/dashboard");
  return { success: true };
}

// ── Paystack payouts ──────────────────────────────────────

export async function getPaystackBanks(): Promise<
  | { success: true; banks: BankOption[]; mobileMoneyFound: boolean }
  | { success: false; error: string }
> {
  const { user } = await getSession();
  if (!user) return { success: false, error: "Please sign in to continue." };

  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) {
    return { success: false, error: "Payouts aren't available yet. Please try again later." };
  }

  let res: Response;
  try {
    res = await fetch(`${PAYSTACK_API}/bank?country=kenya`, {
      headers: { Authorization: `Bearer ${secret}` },
      cache: "no-store",
    });
  } catch {
    return { success: false, error: "We couldn't reach the payout service. Please try again." };
  }

  if (!res.ok) {
    return { success: false, error: "We couldn't load the bank list right now. Please try again in a moment." };
  }

  const body = await res.json().catch(() => null);
  if (!body || body.status !== true || !Array.isArray(body.data)) {
    return { success: false, error: "We couldn't load the bank list right now. Please try again in a moment." };
  }

  const banks: BankOption[] = body.data
    .map((bank: Record<string, unknown>) => ({
      name: typeof bank.name === "string" ? bank.name : "Unknown bank",
      code: typeof bank.code === "string" ? bank.code : "",
      isMobileMoney: isMobileMoneyEntry(bank),
    }))
    .filter((bank: BankOption) => bank.code)
    .sort((a: BankOption, b: BankOption) => a.name.localeCompare(b.name));

  return {
    success: true,
    banks,
    mobileMoneyFound: banks.some((bank) => bank.isMobileMoney),
  };
}

function isMobileMoneyEntry(bank: Record<string, unknown>): boolean {
  if (typeof bank.type === "string" && bank.type.toLowerCase() === "mobile_money") {
    return true;
  }
  if (typeof bank.name !== "string") return false;
  return /mobile money|m-pesa|mpesa|safaricom|airtel money|airtel-mmoney|equitel/i.test(bank.name);
}

export type PayoutSetupInput = {
  bankCode: string;
  accountNumber: string;
};

export async function setPayoutAccountAction(input: PayoutSetupInput): Promise<ActionResult> {
  const { supabase, user } = await getSession();
  if (!user) return { success: false, error: "Please sign in to continue." };

  const manager = await isManagerProfile(supabase, user.id);
  if (!manager) {
    return { success: false, error: "Only turf managers can set up payouts." };
  }

  const bankCode = input.bankCode.trim();
  const accountNumber = input.accountNumber.trim();
  if (!bankCode || !accountNumber) {
    return { success: false, error: "Please choose a bank and enter your account number." };
  }

  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) {
    return { success: false, error: "Payouts aren't available yet. Please try again later." };
  }

  const businessName = await resolveBusinessName(supabase, user.id);

  let res: Response;
  try {
    res = await fetch(`${PAYSTACK_API}/subaccount`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        business_name: businessName,
        settlement_bank: bankCode,
        account_number: accountNumber,
        percentage_charge: PAYSTACK_PLATFORM_PERCENTAGE,
        description: "TurfsKE manager subaccount",
      }),
      cache: "no-store",
    });
  } catch {
    return { success: false, error: "We couldn't reach the payout service. Please try again." };
  }

  const body = await res.json().catch(() => null);

  if (!res.ok || !body || body.status !== true) {
    return { success: false, error: friendlyPaystackError(body?.message) };
  }

  const subaccountCode = body?.data?.subaccount_code;
  if (typeof subaccountCode !== "string" || !subaccountCode) {
    return { success: false, error: "We couldn't finish setting up payouts. Please try again." };
  }

  const saved = await saveManagerProfile(supabase, user.id, {
    business_name: businessName,
    paystack_subaccount_code: subaccountCode,
    // Successful Paystack subaccount creation is treated as sufficient proof of a
    // legitimate payout account for now; this is a placeholder trust signal until a
    // real admin-review flow exists, and should be revisited if/when manual admin
    // verification is built.
    verified: true,
  });

  if (!saved) {
    return {
      success: false,
      error:
        "Your bank details were verified with Paystack, but we couldn't update your profile. Please try again — your payout details are safe.",
    };
  }

  revalidatePath("/dashboard");
  return { success: true };
}

// ── Settings ──────────────────────────────────────────────

export type SettingsInput = {
  fullName: string;
  phoneNumber: string;
  businessName: string;
};

export async function updateSettingsAction(input: SettingsInput): Promise<ActionResult> {
  const { supabase, user } = await getSession();
  if (!user) return { success: false, error: "Please sign in to continue." };

  const fullName = input.fullName.trim();
  if (!fullName) {
    return { success: false, error: "Please enter your full name." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      phone_number: input.phoneNumber.trim() || null,
    })
    .eq("id", user.id);

  if (profileError) {
    return { success: false, error: "We couldn't update your profile. Please try again." };
  }

  if (profile?.role === "manager" && input.businessName.trim()) {
    const saved = await saveManagerProfile(
      supabase,
      user.id,
      { business_name: input.businessName.trim() },
    );

    if (!saved) {
      return { success: false, error: "We couldn't update your business name. Please try again." };
    }
  }

  revalidatePath("/dashboard");
  return { success: true };
}

// ── Shared helpers ────────────────────────────────────────

async function venueIdForPitch(
  supabase: Awaited<ReturnType<typeof createClient>>,
  pitchId: string,
): Promise<string | null> {
  const { data } = await supabase
    .from("pitches")
    .select("venue_id")
    .eq("id", pitchId)
    .maybeSingle();
  return data?.venue_id ?? null;
}

async function venueBelongsToManager(
  supabase: Awaited<ReturnType<typeof createClient>>,
  venueId: string,
  userId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("venues")
    .select("id")
    .eq("id", venueId)
    .eq("manager_id", userId)
    .maybeSingle();
  return Boolean(data);
}

async function resolveBusinessName(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<string> {
  const { data: manager } = await supabase
    .from("manager_profiles")
    .select("business_name")
    .eq("user_id", userId)
    .maybeSingle();

  const fromManager = manager?.business_name?.trim();
  if (fromManager) return fromManager;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", userId)
    .maybeSingle();

  return profile?.full_name?.trim() || "TurfsKE Manager";
}

// manager_profiles may not have a row yet, so decide between insert and update
// based on whether a row exists, rather than relying on a unique constraint
// that may or may not be defined.
async function saveManagerProfile(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  patch: Record<string, string | boolean>,
): Promise<boolean> {
  const { data: existing } = await supabase
    .from("manager_profiles")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  const result = existing
    ? await supabase.from("manager_profiles").update(patch).eq("user_id", userId)
    : await supabase.from("manager_profiles").insert({ user_id: userId, ...patch });

  return !result.error;
}

function cleanCoordinate(raw: string, max: number, min: number): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const value = Number(trimmed);
  if (!Number.isFinite(value)) return null;
  return value > max || value < min ? null : value;
}

function cleanPrice(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const value = Number(trimmed);
  if (!Number.isFinite(value) || value < 0) return null;
  return Math.round(value * 100) / 100;
}

function friendlyPaystackError(message: unknown): string {
  const text = typeof message === "string" ? message.toLowerCase() : "";

  if (text.includes("account")) {
    return "That bank account couldn't be verified. Double-check the account number and bank, then try again.";
  }
  if (text.includes("business_name") || text.includes("business name")) {
    return "We couldn't set up payouts with that business name. Please try again or contact support.";
  }
  if (text.includes("duplicate") || text.includes("already exists") || text.includes("already linked")) {
    return "This account already has a payout set up. If you think this is a mistake, contact support.";
  }
  return "We couldn't set up payouts right now. Please try again or contact support.";
}