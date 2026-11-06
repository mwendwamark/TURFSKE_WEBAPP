export function formatKes(value: number | string): string {
  const whole = Math.round(Number(value));
  if (!Number.isFinite(whole)) return "KES 0";
  return `KES ${String(whole).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}
