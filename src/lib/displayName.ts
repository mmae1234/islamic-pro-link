type NameLike = {
  first_name?: string | null;
  last_name?: string | null;
  /** Computed by the database: personal name, or business name if none. */
  display_name?: string | null;
} | null | undefined;

/** A member's name for display; business accounts without a personal name show their business. */
export function personName(p: NameLike, fallback = ""): string {
  const full = `${p?.first_name ?? ""} ${p?.last_name ?? ""}`.trim();
  return full || p?.display_name?.trim() || fallback;
}

/** Initials for avatars, from personName. */
export function personInitials(p: NameLike, fallback = "?"): string {
  const name = personName(p);
  if (!name) return fallback;
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}
