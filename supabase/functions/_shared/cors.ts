// Shared CORS helper for edge functions.
//
// Replaces the previous wildcard `Access-Control-Allow-Origin: *` with an
// allowlist. The request's Origin header is reflected back only if it matches
// one of the allowed patterns; unknown origins get no Allow-Origin header,
// which causes the browser to block the response.
//
// Allowlist:
//   - https://muslimprosnet.com
//   - https://www.muslimprosnet.com
//   - any *.lovable.app subdomain (preview + published)
//   - any *.lovable.dev subdomain (dev previews)
//   - any *.muslimprosnet.com subdomain (future use)

const ALLOWED_ORIGINS_EXACT = new Set<string>([
  "https://muslimprosnet.com",
  "https://www.muslimprosnet.com",
]);

const ALLOWED_ORIGIN_SUFFIXES = [
  ".lovable.app",
  ".lovable.dev",
  ".muslimprosnet.com",
];

const BASE_HEADERS = {
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Max-Age": "86400",
  Vary: "Origin",
};

export function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false;
  if (ALLOWED_ORIGINS_EXACT.has(origin)) return true;
  try {
    const url = new URL(origin);
    if (url.protocol !== "https:" && url.protocol !== "http:") return false;
    const host = url.hostname;
    return ALLOWED_ORIGIN_SUFFIXES.some(
      (suffix) => host === suffix.slice(1) || host.endsWith(suffix),
    );
  } catch {
    return false;
  }
}

/**
 * Build CORS headers for a request. If the Origin is in the allowlist, the
 * Allow-Origin header reflects it back. If not, no Allow-Origin header is
 * returned and the browser will block the response.
 */
export function buildCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin");
  const headers: Record<string, string> = { ...BASE_HEADERS };
  if (isOriginAllowed(origin)) {
    headers["Access-Control-Allow-Origin"] = origin!;
  }
  return headers;
}
