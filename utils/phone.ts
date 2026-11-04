export function normalizeKenyanPhone(input: string): string | null {
  const cleaned = input.replace(/[\s()-]/g, "");

  let digits: string;
  if (cleaned.startsWith("+254")) {
    digits = cleaned.slice(4);
  } else if (cleaned.startsWith("254")) {
    digits = cleaned.slice(3);
  } else if (cleaned.startsWith("0")) {
    digits = cleaned.slice(1);
  } else {
    digits = cleaned;
  }

  if (!/^[17][0-9]{8}$/.test(digits)) return null;
  return `+254${digits}`;
}

export function formatPhoneDisplay(e164: string): string {
  const normalized = normalizeKenyanPhone(e164);
  if (!normalized) return e164;

  const digits = normalized.slice(4);
  return `0${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
}
