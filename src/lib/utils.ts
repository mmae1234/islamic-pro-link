import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// SEO utility: sets <title> and the matching og:title for social previews.
export function setSEOTitle(title: string) {
  if (typeof document === "undefined") return;
  document.title = title;
  setMetaProperty("og:title", title);
  setMetaName("twitter:title", title);
}

/**
 * Sets a <meta name="..."> tag. When `name` is "description", also mirrors
 * the value into og:description and twitter:description so each route ships
 * a unique social preview rather than inheriting the homepage default.
 */
export function setSEOMeta(name: string, content: string) {
  if (typeof document === "undefined") return;
  setMetaName(name, content);
  if (name === "description") {
    setMetaProperty("og:description", content);
    setMetaName("twitter:description", content);
  }
}

/** Update og:url to the current page so social crawlers see per-route URLs. */
export function setSEOCanonicalUrl(url?: string) {
  if (typeof document === "undefined") return;
  const href = url ?? window.location.href;
  setMetaProperty("og:url", href);
}

function setMetaName(name: string, content: string) {
  let meta = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute("name", name);
    document.head.appendChild(meta);
  }
  meta.setAttribute("content", content);
}

function setMetaProperty(property: string, content: string) {
  let meta = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement | null;
  if (!meta) {
    meta = document.createElement("meta");
    meta.setAttribute("property", property);
    document.head.appendChild(meta);
  }
  meta.setAttribute("content", content);
}
