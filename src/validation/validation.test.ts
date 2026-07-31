import {
  PASSWORD_MIN_LENGTH,
  isValid,
  validateBusinessName,
  validateEmail,
  validatePassword,
  validatePasswordPresent,
  validateSector,
} from './validation';

describe('validateEmail', () => {
  it('accepts ordinary and plus-addressed emails', () => {
    expect(validateEmail('owner@northsideair.com')).toBeNull();
    expect(validateEmail('owner+catch@northsideair.co.uk')).toBeNull();
  });

  it('trims surrounding whitespace before judging', () => {
    // Keyboards on iOS append a space after autocomplete, which would otherwise be
    // reported as an invalid address.
    expect(validateEmail('  owner@northsideair.com  ')).toBeNull();
  });

  it('rejects empty and malformed addresses', () => {
    expect(validateEmail('')).toBe('Enter your email address');
    expect(validateEmail('   ')).toBe('Enter your email address');
    expect(validateEmail('owner')).not.toBeNull();
    expect(validateEmail('owner@')).not.toBeNull();
    expect(validateEmail('owner@localhost')).not.toBeNull();
    expect(validateEmail('owner @northsideair.com')).not.toBeNull();
  });
});

describe('validatePassword', () => {
  it('requires the minimum length', () => {
    expect(validatePassword('a'.repeat(PASSWORD_MIN_LENGTH))).toBeNull();
    expect(validatePassword('a'.repeat(PASSWORD_MIN_LENGTH - 1))).toBe(
      `Use at least ${PASSWORD_MIN_LENGTH} characters`,
    );
  });

  it('reports an empty password distinctly from a short one', () => {
    expect(validatePassword('')).toBe('Enter a password');
  });

  it('does not trim — spaces are legitimate password characters', () => {
    // Eight characters, only four of them non-space. Trimming first would reject it.
    expect(validatePassword('  abcd  ')).toBeNull();
  });
});

describe('validatePasswordPresent', () => {
  it('accepts any non-empty password so old accounts can still log in', () => {
    // Login must not enforce the current signup rules; tightening them later would
    // otherwise lock out every existing account.
    expect(validatePasswordPresent('short')).toBeNull();
    expect(validatePasswordPresent('')).toBe('Enter your password');
  });
});

describe('validateBusinessName', () => {
  it('accepts a normal business name', () => {
    expect(validateBusinessName('Northside Heating & Air')).toBeNull();
  });

  it('rejects blank and whitespace-only names', () => {
    expect(validateBusinessName('')).toBe('Enter your business name');
    expect(validateBusinessName('    ')).toBe('Enter your business name');
  });

  it('rejects names past the column limit', () => {
    expect(validateBusinessName('a'.repeat(120))).toBeNull();
    expect(validateBusinessName('a'.repeat(121))).not.toBeNull();
  });
});

describe('validateSector', () => {
  it('requires a selection', () => {
    expect(validateSector('hvac')).toBeNull();
    expect(validateSector(null)).toBe('Choose the sector you work in');
  });
});

describe('isValid', () => {
  it('is true only when every field passed', () => {
    expect(isValid({ a: null, b: null })).toBe(true);
    expect(isValid({ a: null, b: 'nope' })).toBe(false);
    expect(isValid({})).toBe(true);
  });
});
