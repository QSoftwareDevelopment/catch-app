/**
 * Field validation for the auth forms.
 *
 * Pure functions, no React and no network, so they can be tested directly. Each returns
 * an error message to show beneath the field, or null when the value is acceptable.
 *
 * These run before any request so a typo costs nothing. They are a convenience, not a
 * security control — Supabase and the Postgres constraints are the real gate.
 */

export const PASSWORD_MIN_LENGTH = 8;
export const BUSINESS_NAME_MAX_LENGTH = 120;

/**
 * Deliberately permissive. Anything stricter rejects addresses that are in fact valid
 * (plus-addressing, new TLDs, quoted locals). The confirmation email is the real test of
 * whether an address works; this only catches obvious slips.
 */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(raw: string): string | null {
  const value = raw.trim();
  if (value.length === 0) return 'Enter your email address';
  if (!EMAIL_PATTERN.test(value)) return 'That does not look like an email address';
  return null;
}

export function validatePassword(value: string): string | null {
  if (value.length === 0) return 'Enter a password';
  if (value.length < PASSWORD_MIN_LENGTH) {
    return `Use at least ${PASSWORD_MIN_LENGTH} characters`;
  }
  return null;
}

/** Login only checks that something was typed — length rules belong to signup. */
export function validatePasswordPresent(value: string): string | null {
  return value.length === 0 ? 'Enter your password' : null;
}

export function validateBusinessName(raw: string): string | null {
  const value = raw.trim();
  if (value.length === 0) return 'Enter your business name';
  if (value.length > BUSINESS_NAME_MAX_LENGTH) {
    return `Keep it under ${BUSINESS_NAME_MAX_LENGTH} characters`;
  }
  return null;
}

export function validateSector(value: string | null): string | null {
  return value === null ? 'Choose the sector you work in' : null;
}

/** True when every field in a validation result set passed. */
export function isValid(errors: Record<string, string | null>): boolean {
  return Object.values(errors).every((error) => error === null);
}
