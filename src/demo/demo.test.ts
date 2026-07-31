import { Platform } from 'react-native';

import { DEFAULT_DEMO_SECTOR, demoSectorFromUrl, isDemoMode } from './demo';

/**
 * The safety property under test: demo mode must be off unless explicitly asked for.
 * A production build that shipped a fake session would show every user someone else's
 * business name and let them past the auth wall.
 */

const originalDemoEnv = process.env.EXPO_PUBLIC_DEMO;

function setWebLocation(search: string) {
  Object.defineProperty(Platform, 'OS', { value: 'web', configurable: true });
  // jsdom gives us a window; only the query string needs steering.
  Object.defineProperty(window, 'location', {
    value: { search },
    configurable: true,
    writable: true,
  });
}

afterEach(() => {
  if (originalDemoEnv === undefined) delete process.env.EXPO_PUBLIC_DEMO;
  else process.env.EXPO_PUBLIC_DEMO = originalDemoEnv;
  Object.defineProperty(Platform, 'OS', { value: 'ios', configurable: true });
});

describe('isDemoMode', () => {
  it('is off by default', () => {
    delete process.env.EXPO_PUBLIC_DEMO;
    expect(isDemoMode()).toBe(false);
  });

  it('is off on native even with a demo-looking query string', () => {
    // A native build has no query string; this guards against the web branch leaking.
    delete process.env.EXPO_PUBLIC_DEMO;
    Object.defineProperty(Platform, 'OS', { value: 'ios', configurable: true });
    expect(isDemoMode()).toBe(false);
  });

  it('turns on for ?demo=1 on web', () => {
    delete process.env.EXPO_PUBLIC_DEMO;
    setWebLocation('?demo=1');
    expect(isDemoMode()).toBe(true);
  });

  it('turns on for a bare ?demo flag', () => {
    delete process.env.EXPO_PUBLIC_DEMO;
    setWebLocation('?demo');
    expect(isDemoMode()).toBe(true);
  });

  it('stays off for an unrelated query string', () => {
    delete process.env.EXPO_PUBLIC_DEMO;
    setWebLocation('?utm_source=email&ref=slack');
    expect(isDemoMode()).toBe(false);
  });

  it('turns on for the explicit native env flag', () => {
    process.env.EXPO_PUBLIC_DEMO = '1';
    expect(isDemoMode()).toBe(true);
  });

  it('ignores any other value of the env flag', () => {
    process.env.EXPO_PUBLIC_DEMO = '0';
    expect(isDemoMode()).toBe(false);
    process.env.EXPO_PUBLIC_DEMO = 'true';
    expect(isDemoMode()).toBe(false);
  });
});

describe('demoSectorFromUrl', () => {
  it('reads a valid sector from the link', () => {
    // Lets a shared link open straight onto the sector under review.
    setWebLocation('?demo=1&sector=restaurant');
    expect(demoSectorFromUrl()).toBe('restaurant');
  });

  it('ignores a sector this build does not know', () => {
    setWebLocation('?demo=1&sector=crypto');
    expect(demoSectorFromUrl()).toBe(DEFAULT_DEMO_SECTOR);
  });

  it('falls back when no sector is given', () => {
    setWebLocation('?demo=1');
    expect(demoSectorFromUrl()).toBe(DEFAULT_DEMO_SECTOR);
  });

  it('falls back on native', () => {
    Object.defineProperty(Platform, 'OS', { value: 'android', configurable: true });
    expect(demoSectorFromUrl()).toBe(DEFAULT_DEMO_SECTOR);
  });
});
