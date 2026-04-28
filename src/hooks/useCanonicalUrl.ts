import { useEffect } from "react";

/**
 * Sets <link rel="canonical"> for the current route.
 *
 * The base index.html ships with a canonical pointing at the site root, which
 * is correct for `/` but misleading for every other route — Lighthouse flags
 * it as `canonical: invalid` on deep pages and search engines may consolidate
 * signals onto the wrong URL.
 *
 * Pages that want an accurate canonical should call this with their own path.
 * Pass an absolute URL when the canonical lives on a different origin (rare),
 * otherwise the path is resolved against `window.location.origin`.
 */
export const useCanonicalUrl = (path: string) => {
  useEffect(() => {
    if (typeof document === "undefined") return;

    const href = path.startsWith("http")
      ? path
      : `${window.location.origin}${path.startsWith("/") ? path : `/${path}`}`;

    let link = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    const created = !link;
    if (!link) {
      link = document.createElement("link");
      link.rel = "canonical";
      document.head.appendChild(link);
    }
    const previous = link.getAttribute("href");
    link.setAttribute("href", href);

    return () => {
      // Restore previous href on unmount so SPA navigations don't leak the
      // last route's canonical onto the next page before its effect fires.
      if (created) {
        link?.parentNode?.removeChild(link);
      } else if (previous !== null) {
        link?.setAttribute("href", previous);
      }
    };
  }, [path]);
};
