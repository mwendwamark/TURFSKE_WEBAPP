/**
 * Normalise a custom amenity name:
 * - trim leading/trailing whitespace
 * - collapse any runs of internal whitespace to a single space
 * - title-case each word (first letter upper, rest lower)
 * - but leave words that are already fully uppercase untouched (e.g. "CCTV"
 *   stays "CCTV", "AI" stays "AI").
 * - returns the normalised string, or an empty string if the input was empty.
 */
export function normalizeAmenityName(input: string): string {
  const trimmed = input.trim();

  if (!trimmed) {
    return "";
  }

  // Collapse multiple spaces to a single space.
  const collapsed = trimmed.replace(/\s+/g, " ");

  // Split into words, title-case each one unless it is already all caps.
  const words = collapsed.split(" ");
  const processed = words.map((word) => {
    // If the word is already entirely uppercase, keep it as-is.
    if (word === word.toUpperCase() && word.length > 1) {
      return word;
    }
    // Otherwise, title-case: first letter upper, rest lower.
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  });

  return processed.join(" ");
}

/**
 * Validate that a normalised amenity name is within the allowed length
 * (2–40 characters). Returns the normalised name if valid, or null if not.
 */
export function validateAmenityName(name: string): string | null {
  const normalised = normalizeAmenityName(name);
  if (normalised.length < 2 || normalised.length > 40) {
    return null;
  }
  return normalised;
}