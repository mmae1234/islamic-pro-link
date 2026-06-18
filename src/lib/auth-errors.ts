/**
 * Pure helpers for translating Supabase Auth errors into user-facing copy.
 *
 * Kept module-local and side-effect free so they're trivially unit-testable
 * once a test runner is configured.
 */

import type { AuthError } from "@supabase/supabase-js";

/**
 * Friendly copy for each rate-limit context. Wording is intentionally
 * actionable: tell the user what to do next, not just that they hit a wall.
 */
export const RATE_LIMIT_MESSAGES = {
  resetPassword:
    "Too many reset requests. Please wait an hour, or check your inbox — your previous reset email may still be valid.",
  signIn:
    "Too many sign-in attempts. Please wait a few minutes and try again.",
  signUp:
    "Too many signup attempts from this address. Please wait a few minutes before trying again.",
} as const;

export type RateLimitContext = keyof typeof RATE_LIMIT_MESSAGES;

/**
 * Detect a Supabase Auth rate-limit error.
 *
 * Supabase returns 429 with a body like
 *   { error: "over_email_send_rate_limit", message: "For security purposes,
 *     you can only request this once every 60 seconds" }
 * or message variants like "You have exceeded the maximum number of …".
 *
 * We match on either status === 429 OR message ~= /rate.?limit|maximum/i so a
 * change in either dimension upstream still triggers the friendly copy.
 *
 * @param err  the value caught from a try/catch around a Supabase auth call
 */
export function isRateLimitError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;

  const e = err as Partial<AuthError> & {
    status?: number;
    statusCode?: number;
    code?: string;
  };

  if (e.status === 429 || e.statusCode === 429) return true;

  if (typeof e.message === "string" && /rate.?limit|maximum/i.test(e.message)) {
    return true;
  }

  // Supabase also emits machine codes like "over_email_send_rate_limit",
  // "over_request_rate_limit". Treat any *_rate_limit code as rate-limited.
  if (typeof e.code === "string" && /rate_limit/i.test(e.code)) return true;

  return false;
}

/**
 * Compose a toast description, choosing the friendly rate-limit copy when the
 * error matches and falling back to the raw Supabase message otherwise.
 */
export function describeAuthError(
  err: unknown,
  context: RateLimitContext,
): string {
  if (isRateLimitError(err)) return RATE_LIMIT_MESSAGES[context];
  if (err && typeof err === "object" && "message" in err) {
    const m = (err as { message?: unknown }).message;
    if (typeof m === "string" && m.length > 0) return m;
  }
  return "Something went wrong. Please try again.";
}
