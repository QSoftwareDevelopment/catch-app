import type { AuthError } from '@supabase/supabase-js';

/**
 * Turns a Supabase auth error into something a business owner can act on.
 *
 * Raw errors are written for developers ("Invalid login credentials", "User already
 * registered") and some leak internals. Anything unrecognised collapses to a generic
 * message and is logged, so an unexpected backend change degrades to a vague message
 * rather than a wall of jargon.
 */

export type FriendlyError = {
  message: string;
  /** When set, the message belongs beneath this field instead of at form level. */
  field?: 'email' | 'password';
};

const GENERIC: FriendlyError = {
  message: 'Something went wrong on our end. Please try again.',
};

const NETWORK: FriendlyError = {
  message: 'Could not reach Catch. Check your connection and try again.',
};

export function describeAuthError(error: AuthError | Error | null): FriendlyError | null {
  if (!error) return null;

  // supabase-js surfaces fetch failures as a generic TypeError before any status exists.
  const raw = error.message ?? '';
  if (/network request failed|fetch failed|load failed/i.test(raw)) {
    return NETWORK;
  }

  const code = 'code' in error ? (error.code as string | undefined) : undefined;

  switch (code) {
    case 'invalid_credentials':
      return { message: 'That email and password do not match an account.' };
    case 'email_not_confirmed':
      return {
        message: 'Confirm your email first — check your inbox for the link we sent.',
      };
    case 'user_already_exists':
    case 'email_exists':
      return { message: 'That email is already registered. Try logging in.', field: 'email' };
    case 'weak_password':
      return { message: 'That password is too weak. Try a longer one.', field: 'password' };
    case 'over_request_rate_limit':
    case 'over_email_send_rate_limit':
      return { message: 'Too many attempts. Wait a minute and try again.' };
    case 'validation_failed':
      return { message: 'Check the details above and try again.' };
    default:
      break;
  }

  // Older projects return prose without a code, so fall back to matching on it.
  if (/invalid login credentials/i.test(raw)) {
    return { message: 'That email and password do not match an account.' };
  }
  if (/already registered|already exists/i.test(raw)) {
    return { message: 'That email is already registered. Try logging in.', field: 'email' };
  }
  if (/email not confirmed/i.test(raw)) {
    return {
      message: 'Confirm your email first — check your inbox for the link we sent.',
    };
  }

  console.warn('[auth] unmapped error', { code, message: raw });
  return GENERIC;
}
