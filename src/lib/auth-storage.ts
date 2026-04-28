// Browser/iOS storage probing helpers used by AuthContext and the Supabase client.
//
// iOS Safari (especially Private Browsing) blocks localStorage and can throw on
// access. We always check defensively before assuming storage works. These
// helpers keep that messy logic in one place.

export const isIOS = (): boolean =>
  typeof navigator !== "undefined" && /iPad|iPhone|iPod/.test(navigator.userAgent);

/**
 * Probe whether a given Storage implementation actually works.
 * Returns false on iOS Private mode and any environment where storage is
 * blocked, throws, or silently no-ops.
 */
export const isStorageUsable = (storage: Storage | undefined): boolean => {
  if (!storage) return false;
  try {
    const k = "__storage_probe__";
    storage.setItem(k, "1");
    const v = storage.getItem(k);
    storage.removeItem(k);
    return v === "1";
  } catch {
    return false;
  }
};

/** Convenience: is localStorage usable in this browser right now? */
export const hasLocalStorage = (): boolean => {
  if (typeof window === "undefined") return false;
  return isStorageUsable(window.localStorage);
};

/** Race a promise against a timeout. Rejects with `Error(label)` on timeout. */
export const withTimeout = <T>(p: Promise<T>, ms: number, label = "timeout"): Promise<T> =>
  Promise.race([
    p,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(label)), ms)),
  ]);
