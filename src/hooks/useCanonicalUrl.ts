import { useEffect } from "react";

/**
 * Sets <link rel="canonical"> for the current route (last-write-wins).
 *
 * The base index.html ships with a canonical pointing at the site root, which
 * is the acceptable steady-state default for any route that doesn't call this
 * hook. Pages that want an accurate canonical should call this with their own
 * path. Pass an absolute URL when the canonical lives on a different origin
 * (rare); otherwise the path is resolved against `window.location.origin`.
 *
 * No cleanup on unmount: SPA mount/unmount ordering during route transitions
 * is not guaranteed, and a restore-on-unmount pattern is fragile to reason
 * about. Last-write-wins is correct as long as every route that needs a
 * non-default canonical calls this hook. If a user navigates from a hooked
 * route to a non-hooked route, the canonical will be stale — propagate the
 * hook to that route rather than reintroducing cleanup logic.
 */
export const useCanonicalUrl = (path: string) => {
  useEffect(() => {
    if (typeof document === "undefined") return;

    const href = path.startsWith("http")
      ? path
      : `${window.location.origin}${path.startsWith("/") ? path : `/${path}`}`;

    let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "canonical";
      document.head.appendChild(link);
    }
    link.setAttribute("href", href);
  }, [path]);
};
