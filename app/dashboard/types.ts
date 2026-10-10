export type Amenity = {
  id: string;
  name: string;
};

export type VenueImage = {
  id: string;
  venue_id: string;
  storage_path: string;
  position: number;
};

export type PitchImage = {
  id: string;
  pitch_id: string;
  storage_path: string;
  position: number;
};

export type Pitch = {
  id: string;
  venue_id: string;
  name: string;
  sport_type: string;
  size: string | null;
  price_per_hour: number | null;
  surface_type: string | null;
  status: string;
  pitch_images?: PitchImage[];
};

export type Venue = {
  id: string;
  name: string;
  address_text: string | null;
  latitude: number | null;
  longitude: number | null;
  description: string | null;
  rules: string | null;
};

export type VenueAmenityLink = {
  amenity_id: string;
  /** Populated when the query embeds the amenities table (venue detail page). */
  amenities?: { id: string; name: string } | null;
};

export type VenueWithRelations = Venue & {
  pitches: Pitch[];
  venue_amenities: VenueAmenityLink[];
  venue_images: VenueImage[];
};

export type PayoutStatus = {
  businessName: string | null;
  paystackSubaccountCode: string | null;
  verified: boolean | null;
};

export type BankOption = {
  name: string;
  code: string;
  isMobileMoney: boolean;
};

export type ActionResult =
  | { success: true }
  | { success: false; error: string };

export type ActionResultWithData<T> =
  | { success: true; data: T }
  | { success: false; error: string };