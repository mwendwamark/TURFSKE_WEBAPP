const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const NAIROBI_OFFSET_MS = 3 * 60 * 60 * 1000;

function toNairobiDate(iso: string): Date {
  return new Date(new Date(iso).getTime() + NAIROBI_OFFSET_MS);
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function formatTime(iso: string): string {
  const date = toNairobiDate(iso);
  return `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`;
}

function isSameNairobiDay(a: Date, b: Date): boolean {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  );
}

export function formatNairobiDateTime(iso: string): string {
  const date = toNairobiDate(iso);
  const day = DAY_NAMES[date.getUTCDay()];
  const month = MONTH_NAMES[date.getUTCMonth()];
  return `${day} ${date.getUTCDate()} ${month}, ${formatTime(iso)}`;
}

export function formatNairobiRange(startIso: string, endIso: string): string {
  const start = toNairobiDate(startIso);
  const end = toNairobiDate(endIso);
  const startLabel = formatNairobiDateTime(startIso);

  if (isSameNairobiDay(start, end)) {
    return `${startLabel} to ${formatTime(endIso)}`;
  }

  return `${startLabel} to ${formatNairobiDateTime(endIso)}`;
}

export function currentTimeMs(): number {
  return Date.now();
}

export function isPastIso(iso: string, now: number = currentTimeMs()): boolean {
  return new Date(iso).getTime() < now;
}
