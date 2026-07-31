import { Platform } from 'react-native';

import { isSectorId, type SectorId } from '@/sectors/sectors';

/**
 * Demo mode: run the whole app against fake data, with no Supabase and no account.
 *
 * It exists because the real signup path is blocked on a schema migration, and everything
 * worth reviewing — the home screen, the sector-driven catalog labels, settings — sits
 * behind the auth wall. Without this, a shared link shows a login form and nothing else.
 *
 * It also makes the sector copy reviewable: a reviewer can switch sector live and watch
 * every label change, instead of creating eight accounts.
 *
 * Enabled by `?demo=1` on web, or EXPO_PUBLIC_DEMO=1 for a native build. Never enabled by
 * default, so a production build cannot accidentally ship a fake session.
 */

export const DEMO_BUSINESS_NAME = 'Northside Heating & Air';
export const DEMO_EMAIL = 'owner@northsideair.com';
export const DEFAULT_DEMO_SECTOR: SectorId = 'hvac';

export function isDemoMode(): boolean {
  if (process.env.EXPO_PUBLIC_DEMO === '1') return true;

  // Web-only from here: there is no query string on a native launch.
  if (Platform.OS !== 'web') return false;
  if (typeof window === 'undefined' || !window.location) return false;

  try {
    return new URLSearchParams(window.location.search).has('demo');
  } catch {
    return false;
  }
}

/** Lets a shared link open on a specific sector, e.g. `?demo=1&sector=restaurant`. */
export function demoSectorFromUrl(): SectorId {
  if (Platform.OS !== 'web') return DEFAULT_DEMO_SECTOR;
  if (typeof window === 'undefined' || !window.location) return DEFAULT_DEMO_SECTOR;

  try {
    const requested = new URLSearchParams(window.location.search).get('sector');
    return isSectorId(requested) ? requested : DEFAULT_DEMO_SECTOR;
  } catch {
    return DEFAULT_DEMO_SECTOR;
  }
}
