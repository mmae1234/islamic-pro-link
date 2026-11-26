/** Display-only: US numbers (10 digits, or 11 starting with 1) as (971) 514-8923; anything else unchanged. */
export function formatPhone(raw: string | null | undefined): string {
  if (!raw) return "";
  const trimmed = raw.trim();
  const digits = trimmed.replace(/\D/g, "");
  const isPlainTen = digits.length === 10 && !trimmed.startsWith("+");
  const isUsEleven = digits.length === 11 && digits.startsWith("1") && (trimmed.startsWith("+1") || !trimmed.startsWith("+"));
  if (!isPlainTen && !isUsEleven) return trimmed;
  const d = isUsEleven ? digits.slice(1) : digits;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}
