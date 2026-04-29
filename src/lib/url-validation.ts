// URL validation helpers for user-provided social/website fields.
// Rejects javascript:, data:, file: and other non-http(s) schemes that could
// become XSS sinks if rendered into <a href>.

export interface UrlValidationResult {
  isValid: boolean;
  sanitized: string;
  error?: string;
}

export function validateHttpUrl(input: string, opts: { required?: boolean } = {}): UrlValidationResult {
  const trimmed = (input ?? '').trim();
  if (!trimmed) {
    return opts.required
      ? { isValid: false, sanitized: '', error: 'URL is required' }
      : { isValid: true, sanitized: '' };
  }

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    // Auto-prepend https:// for bare hostnames like "example.com"
    try {
      url = new URL(`https://${trimmed}`);
    } catch {
      return { isValid: false, sanitized: '', error: 'Enter a valid URL' };
    }
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return { isValid: false, sanitized: '', error: 'URL must start with http:// or https://' };
  }

  if (trimmed.length > 500) {
    return { isValid: false, sanitized: '', error: 'URL too long (max 500 characters)' };
  }

  return { isValid: true, sanitized: url.toString() };
}

// Phone number sanitisation — keeps + and digits only.
export function validatePhoneNumber(input: string): UrlValidationResult {
  const trimmed = (input ?? '').trim();
  if (!trimmed) return { isValid: true, sanitized: '' };

  const cleaned = trimmed.replace(/[^\d+]/g, '');
  if (cleaned.length < 6 || cleaned.length > 20) {
    return { isValid: false, sanitized: '', error: 'Enter a valid phone number' };
  }
  return { isValid: true, sanitized: cleaned };
}
