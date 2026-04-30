/**
 * Thin wrapper around @sentry/react.
 *
 * Feature code should import from here, never from "@sentry/react" directly,
 * so we can swap providers or no-op the module without touching call sites.
 *
 * Lazy-loaded: the SDK is dynamic-imported inside `initSentry()` rather than
 * at module top level. This keeps the ~273 KB Sentry bundle out of the entry
 * chunk on the landing page. Errors that arrive before the SDK finishes
 * loading are queued and drained once init resolves.
 *
 * Initialization is gated on `import.meta.env.VITE_SENTRY_DSN` — if the var
 * is missing (local dev, forks, CI without secrets) the module is a complete
 * no-op and `@sentry/react` is never even imported at runtime.
 *
 * Privacy posture:
 *   - sendDefaultPii: false
 *   - User context: id only (no email / no name)
 *   - beforeSend: drops events when offline, scrubs email-shaped strings
 *     from `extra` and from breadcrumb messages.
 */

// The SDK once loaded. Stays null when DSN is unset (no-op mode).
type SentrySdk = typeof import("@sentry/react");
let sdk: SentrySdk | null = null;
let initialized = false;

// Cap so a runaway loop doesn't grow this unbounded.
const MAX_QUEUED = 50;

type CaptureCtx = { tags?: Record<string, string>; extra?: Record<string, unknown> };
const pendingExceptions: Array<{ err: unknown; ctx?: CaptureCtx }> = [];
// `undefined` = nothing queued; `null` = pending sign-out; string = pending sign-in id.
let pendingUserId: string | null | undefined = undefined;

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;

const scrubEmails = (value: string): string =>
  value.replace(EMAIL_RE, "[email]");

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

/**
 * Lazy-init Sentry. Resolves once the SDK is loaded and configured (or
 * immediately, if VITE_SENTRY_DSN is unset). Idempotent.
 *
 * Callers don't need to await this — fire and forget. Any exceptions or
 * user-context changes that arrive while the import is in flight are queued
 * and drained when init completes.
 */
export async function initSentry(): Promise<void> {
  if (initialized) return;

  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
  if (!dsn) {
    // Mark as "done" so we don't keep queuing into a void.
    initialized = true;
    pendingExceptions.length = 0;
    pendingUserId = undefined;
    return;
  }

  // Dynamic import — keeps the Sentry bundle out of the landing entry chunk.
  // Vite/Rollup splits this into its own vendor chunk (vendor-sentry).
  const Sentry: SentrySdk = await import("@sentry/react");

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
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],

    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0.0,
    replaysOnErrorSampleRate: 1.0,

    beforeSend(event) {
      if (typeof navigator !== "undefined" && navigator.onLine === false) {
        return null;
      }
      if (event.extra) {
        event.extra = scrubExtra(event.extra);
      }
      if (event.breadcrumbs) {
        event.breadcrumbs = event.breadcrumbs.map((b) =>
          b.message ? { ...b, message: scrubEmails(b.message) } : b,
        );
      }
      return event;
    },
  });

  sdk = Sentry;
  initialized = true;

  // Drain queued captures and pending user-context.
  for (const p of pendingExceptions) {
    Sentry.captureException(p.err, {
      tags: p.ctx?.tags,
      extra: p.ctx?.extra ? scrubExtra(p.ctx.extra) : undefined,
    });
  }
  pendingExceptions.length = 0;

  if (pendingUserId !== undefined) {
    Sentry.setUser(pendingUserId ? { id: pendingUserId } : null);
    pendingUserId = undefined;
  }
}

/**
 * Capture an exception with optional context.
 * Safe to call before initSentry() resolves — events are queued (up to 50)
 * and flushed once init completes. No-op when VITE_SENTRY_DSN is unset.
 */
export function captureException(err: unknown, ctx?: CaptureCtx): void {
  if (sdk) {
    sdk.captureException(err, {
      tags: ctx?.tags,
      extra: ctx?.extra ? scrubExtra(ctx.extra) : undefined,
    });
    return;
  }
  // Either init hasn't resolved yet, or DSN is unset and we marked initialized
  // without loading the SDK. Queue only in the former case.
  if (!initialized && pendingExceptions.length < MAX_QUEUED) {
    pendingExceptions.push({ err, ctx });
  }
}

/**
 * Set or clear the current user context. Pass *id only* — never email or name.
 * Safe to call before initSentry() resolves — the latest value is applied
 * once init completes. No-op when VITE_SENTRY_DSN is unset.
 */
export function setSentryUser(id: string | null): void {
  if (sdk) {
    sdk.setUser(id ? { id } : null);
    return;
  }
  if (!initialized) {
    pendingUserId = id;
  }
}
