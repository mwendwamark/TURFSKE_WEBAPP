export type Pitch = {
  id: string;
  pricing_model: "per_pitch" | "per_person";
  price_per_hour: number | null;
  min_players: number | null;
  max_players: number | null;
};

// What the cheapest booking of this pitch costs (group minimum for per person).
export function pitchStartingPrice(pitch: Pitch): number | null {
  if (pitch.price_per_hour == null) return null;
  if (pitch.pricing_model === "per_person") {
    return pitch.price_per_hour * (pitch.min_players ?? 1);
  }
  return pitch.price_per_hour;
}

export function pitchPriceLabel(pitch: Pitch): string {
  if (pitch.price_per_hour == null) return "Price not set";
  const price = pitch.price_per_hour.toLocaleString();
  return pitch.pricing_model === "per_person"
    ? `KES ${price} per person/hr`
    : `KES ${price}/hr`;
}

export function pitchPlayersLabel(pitch: Pitch): string | null {
  const { min_players: min, max_players: max } = pitch;
  if (pitch.pricing_model === "per_person") {
    if (min != null && max != null) {
      return min === max ? `${min} players` : `${min} to ${max} players`;
    }
    return null;
  }
  return max != null ? `Up to ${max} players` : null;
}

// Preview only. The server decides the real total.
export function computeTotals(
  pitch: Pitch,
  players: number,
  spectators: number,
  spectatorFee: number | null,
): { pitchAmount: number; spectatorAmount: number; total: number } {
  const rate = pitch.price_per_hour ?? 0;
  const pitchAmount =
    pitch.pricing_model === "per_person" ? rate * players : rate;
  const spectatorAmount =
    spectatorFee != null && spectators > 0 ? spectatorFee * spectators : 0;
  return { pitchAmount, spectatorAmount, total: pitchAmount + spectatorAmount };
}
