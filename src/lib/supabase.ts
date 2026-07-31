import 'react-native-url-polyfill/auto';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

import { secureStorageAdapter } from './secureStorage';
import type { Database } from './database.types';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Fail loudly at startup rather than letting every request 401 with no explanation.
 * `EXPO_PUBLIC_*` values are inlined at build time, so a missing key means the .env was
 * absent when Metro started — restarting the bundler is usually the fix.
 */
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Supabase is not configured. Copy .env.example to .env, fill in your project URL ' +
      'and anon key, then restart the dev server so Expo picks them up.',
  );
}

export const supabase: SupabaseClient<Database> = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      // Keychain on iOS, Keystore on Android. On web SecureStore does not exist, so the
      // adapter falls through to the default browser storage.
      storage: Platform.OS === 'web' ? undefined : secureStorageAdapter,
      autoRefreshToken: true,
      persistSession: true,
      // Native apps have no URL to parse a session out of; the deep link handler owns it.
      detectSessionInUrl: false,
    },
  },
);

/**
 * Refresh tokens only while the app is actually in front of the user. Left running in the
 * background the timer fires against a suspended socket and burns battery for nothing.
 */
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      void supabase.auth.startAutoRefresh();
    } else {
      void supabase.auth.stopAutoRefresh();
    }
  });
}
