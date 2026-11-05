const ALLOWED_PREFIXES = ["/dashboard/explore/", "/venues/"];

/**
 * Only allow return paths that stay on this site and on a venue page.
 * Reject protocol-relative URLs, backslashes and anything with a scheme.
 */
export function safeNextPath(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  if (raw.startsWith("//")) return null;
  if (raw.includes("\\")) return null;
  if (raw.includes("://")) return null;
  if (!ALLOWED_PREFIXES.some((prefix) => raw.startsWith(prefix))) {
    return null;
  }
  return raw;
}
