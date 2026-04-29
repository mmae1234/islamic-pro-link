/**
 * Narrow an unknown caught value to its `.message`. PostgrestError, Error,
 * AuthError, and Sentry-tagged errors all have one — fall back to String().
 */
export function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (
    typeof err === "object" &&
    err !== null &&
    "message" in err &&
    typeof (err as { message: unknown }).message === "string"
  ) {
    return (err as { message: string }).message;
  }
  return String(err);
}
