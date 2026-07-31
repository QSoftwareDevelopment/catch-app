import type { AuthError } from '@supabase/supabase-js';

import { describeAuthError } from './authErrors';

/** Shapes a Supabase-style error without depending on its constructor. */
function authError(message: string, code?: string): AuthError {
  const error = new Error(message) as AuthError;
  if (code) (error as unknown as { code: string }).code = code;
  return error;
}

describe('describeAuthError', () => {
  beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns null when there is no error', () => {
    expect(describeAuthError(null)).toBeNull();
  });

  it('maps bad credentials without revealing which field was wrong', () => {
    const result = describeAuthError(authError('Invalid login credentials', 'invalid_credentials'));
    // Saying "no account with that email" would let anyone enumerate registered addresses.
    expect(result?.message).toBe('That email and password do not match an account.');
    expect(result?.field).toBeUndefined();
  });

  it('points a duplicate signup at the email field', () => {
    const result = describeAuthError(authError('User already registered', 'user_already_exists'));
    expect(result?.field).toBe('email');
    expect(result?.message).toMatch(/already registered/i);
  });

  it('explains an unconfirmed email', () => {
    const result = describeAuthError(authError('Email not confirmed', 'email_not_confirmed'));
    expect(result?.message).toMatch(/confirm your email/i);
  });

  it('recognises rate limiting', () => {
    const result = describeAuthError(authError('rate limited', 'over_request_rate_limit'));
    expect(result?.message).toMatch(/too many attempts/i);
  });

  it('treats fetch failures as a connectivity problem, not a credentials problem', () => {
    const result = describeAuthError(new Error('Network request failed'));
    expect(result?.message).toMatch(/could not reach catch/i);
  });

  it('falls back to message matching when no code is present', () => {
    // Older Supabase projects return prose with no error code.
    expect(describeAuthError(authError('Invalid login credentials'))?.message).toBe(
      'That email and password do not match an account.',
    );
    expect(describeAuthError(authError('User already registered'))?.field).toBe('email');
  });

  it('degrades to a generic message and logs anything unrecognised', () => {
    const result = describeAuthError(authError('pgrst_some_new_thing', 'brand_new_code'));
    expect(result?.message).toBe('Something went wrong on our end. Please try again.');
    expect(console.warn).toHaveBeenCalled();
  });

  it('never leaks the raw error text to the user', () => {
    const raw = 'duplicate key value violates unique constraint "businesses_owner_id_key"';
    expect(describeAuthError(authError(raw))?.message).not.toContain('businesses_owner_id_key');
  });
});
