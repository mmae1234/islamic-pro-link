/**
 * Thin wrapper around @sentry/react.
 *
 * Feature code should import from here, never from "@sentry/react" directly,
 * so we can swap providers or no-op the module without touching call sites.
 *
 * Initialization is idempotent and gated on `import.meta.env.VITE_SENTRY_DSN`
 * — if the var is missing (local dev, forks, CI without secrets) the module
 * is a complete no-op and `@sentry/react` is never even imported at runtime.
 *
 * Privacy posture:
 *   - sendDefaultPii: false
 *   - User context: id only (no email / no name)
 *   - beforeSend: drops events when offline, scrubs email-shaped strings
 *     from `extra` and from breadcrumb messages.
 */
import * as Sentry from "@sentry/react";

let initialized = false;

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;

const scrubEmails = (value: string): string =>
  value.replace(EMAIL_RE, "[email]");

/**
 * Recursively scrub email-shaped strings out of an `extra` payload. Bounded
 * depth so we never recurse into a circular value graph.
 */
const scrubExtra = (
  extra: Record<string, unknown> | undefined,
  depth = 0,
): Record<string, unknown> | undefined => {
  if (!extra || depth > 4) return extra;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(extra)) {
    if (typeof v === "string") {
      out[k] = scrubEmails(v);
    } else if (v && typeof v === "object" && !Array.isArray(v)) {
      out[k] = scrubExtra(v as Record<string, unknown>, depth + 1);
    } else {
      out[k] = v;
    }
  }
  return out;
};

export function initSentry(): void {
  if (initialized) return;

  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
  if (!dsn) {
    // No DSN — leave the helper in no-op mode. Local dev and forks should
    // never need to set the var to get a working build.
    return;
  }

  // Optional release tag; omit (don't fail) if not set.
  const release =
    (import.meta.env.VITE_APP_VERSION as string | undefined) || undefined;

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    release,
    sendDefaultPii: false,

    // Known-harmless noise we never want to page on.
    // - Supabase gotrue-js auth lock contention: the library auto-recovers by
    //   forcefully re-acquiring the lock; no user impact.
    // - ResizeObserver loop notices: benign browser warning.
    ignoreErrors: [
      "AbortError: Lock was stolen by another request",
      "Lock was stolen by another request",
      /Lock .* was not released within \d+ms/i,
      "ResizeObserver loop limit exceeded",
      "ResizeObserver loop completed with undelivered notifications",
    ],

    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        // Privacy-default: never record DOM/network on healthy sessions.
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],

    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0.0,
    replaysOnErrorSampleRate: 1.0,

    beforeSend(event) {
      // Drop everything when offline — there's no point queuing events the
      // user has already moved past, and beacons can survive across reloads
      // in ways we don't want when debugging on a flaky connection.
      if (typeof navigator !== "undefined" && navigator.onLine === false) {
        return null;
      }

      // Scrub email-shaped strings from `extra`.
      if (event.extra) {
        event.extra = scrubExtra(event.extra);
      }

      // Scrub breadcrumb messages.
      if (event.breadcrumbs) {
        event.breadcrumbs = event.breadcrumbs.map((b) =>
          b.message ? { ...b, message: scrubEmails(b.message) } : b,
        );
      }

      return event;
    },
  });

  initialized = true;
}

/**
 * Capture an exception with optional context.
 * Safe to call even when Sentry was never initialized (no-op).
 */
export function captureException(
  err: unknown,
  ctx?: { tags?: Record<string, string>; extra?: Record<string, unknown> },
): void {
  if (!initialized) return;
  Sentry.captureException(err, {
    tags: ctx?.tags,
    extra: ctx?.extra ? scrubExtra(ctx.extra) : undefined,
  });
}

/**
 * Set or clear the current user context. We pass *id only* — never email or
 * name. Safe to call when Sentry was never initialized (no-op).
 */
export function setSentryUser(id: string | null): void {
  if (!initialized) return;
  Sentry.setUser(id ? { id } : null);
}
