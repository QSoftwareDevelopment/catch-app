import type { Session } from '@supabase/supabase-js';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import {
  DEMO_BUSINESS_NAME,
  DEMO_EMAIL,
  demoSectorFromUrl,
  isDemoMode,
} from '@/demo/demo';
import { supabase } from '@/lib/supabase';
import type { Business } from '@/lib/database.types';
import type { SectorId } from '@/sectors/sectors';

/**
 * Owns the answer to "who is using this app". Everything above it in the tree routes off
 * `status`; everything below reads the session and business through `useAuth`.
 *
 * `status` is three-valued on purpose. Collapsing "restoring" into "signed out" makes a
 * returning user see the landing screen flash before being bounced to Home on every cold
 * start.
 */

export type AuthStatus = 'restoring' | 'signedOut' | 'signedIn';

export type SignUpInput = {
  email: string;
  password: string;
  businessName: string;
  sector: SectorId;
};

type AuthContextValue = {
  status: AuthStatus;
  session: Session | null;
  /**
   * The signed-in user's business. Null while it loads, and also when the row is
   * genuinely missing — see `businessMissing`.
   */
  business: Business | null;
  /**
   * True when the user is signed in but has no business row. This should be impossible
   * (the signup trigger creates it), so it means the trigger was never installed or the
   * account predates it. Surfaced rather than hidden so it is diagnosable.
   */
  businessMissing: boolean;
  signUp: (input: SignUpInput) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  resendConfirmation: (email: string) => Promise<void>;
  refreshBusiness: () => Promise<void>;
  /** True when running on fake data with no backend — see src/demo/demo.ts. */
  demoEnabled: boolean;
  /** Live sector switch, so demo reviewers can see every label change at once. */
  demoSector: SectorId;
  setDemoSector: (sector: SectorId) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Read once at mount. Flipping demo mode mid-session would leave stale real state
  // behind, so it is fixed for the lifetime of the app.
  const demoEnabled = useRef(isDemoMode()).current;

  const [status, setStatus] = useState<AuthStatus>('restoring');
  const [session, setSession] = useState<Session | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [businessMissing, setBusinessMissing] = useState(false);
  const [demoSector, setDemoSector] = useState<SectorId>(() =>
    demoEnabled ? demoSectorFromUrl() : 'hvac',
  );

  // Guards against a resolved fetch writing state after unmount or after the user has
  // already signed out again.
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const loadBusiness = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('businesses')
      .select('*')
      .eq('owner_id', userId)
      .maybeSingle();

    if (!mounted.current) return;

    if (error) {
      // A failed read must not strand the user on a spinner; they are still signed in,
      // and Home degrades to a generic greeting.
      console.warn('[auth] could not load business', error.message);
      setBusiness(null);
      setBusinessMissing(false);
      return;
    }

    setBusiness(data ?? null);
    setBusinessMissing(data === null);
  }, []);

  useEffect(() => {
    let active = true;

    // Demo mode never touches Supabase. Start signed out so the landing screen and the
    // signup flow are both reachable; the fake signIn/signUp below move it forward.
    if (demoEnabled) {
      setStatus('signedOut');
      return;
    }

    // Restore whatever is in secure storage before deciding what to render.
    void supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      const restored = data.session ?? null;
      setSession(restored);
      if (restored) {
        await loadBusiness(restored.user.id);
      }
      if (!active) return;
      setStatus(restored ? 'signedIn' : 'signedOut');
    });

    // Covers sign-in, sign-out, token refresh, and password recovery from a deep link.
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, next) => {
      if (!active) return;
      setSession(next);
      setStatus(next ? 'signedIn' : 'signedOut');
      if (next) {
        void loadBusiness(next.user.id);
      } else {
        setBusiness(null);
        setBusinessMissing(false);
      }
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, [loadBusiness, demoEnabled]);

  const signUp = useCallback(async (input: SignUpInput) => {
    if (demoEnabled) {
      // Honour the chosen sector so a reviewer can walk the real signup flow and land
      // on a home screen labelled for the trade they picked.
      setDemoSector(input.sector);
      setStatus('signedIn');
      return;
    }

    // Business name and sector ride along as user metadata. With email confirmation on
    // there is no session yet, so the client cannot insert the row itself — the
    // `handle_new_user` trigger reads this metadata and creates it server-side.
    const { error } = await supabase.auth.signUp({
      email: input.email.trim(),
      password: input.password,
      options: {
        data: {
          business_name: input.businessName.trim(),
          sector: input.sector,
        },
      },
    });
    if (error) throw error;
  }, [demoEnabled]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      if (demoEnabled) {
        setStatus('signedIn');
        return;
      }
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw error;
    },
    [demoEnabled],
  );

  const signOut = useCallback(async () => {
    if (demoEnabled) {
      setStatus('signedOut');
      return;
    }
    const { error } = await supabase.auth.signOut();
    // "Session not found" means the token was already dead. The user asked to sign out
    // and is signed out, so treat it as success rather than trapping them in the app.
    if (error && !/session|not found/i.test(error.message)) throw error;
  }, [demoEnabled]);

  const sendPasswordReset = useCallback(
    async (email: string) => {
      if (demoEnabled) return;
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: 'catch://reset-password',
      });
      if (error) throw error;
    },
    [demoEnabled],
  );

  const resendConfirmation = useCallback(
    async (email: string) => {
      if (demoEnabled) return;
      const { error } = await supabase.auth.resend({ type: 'signup', email: email.trim() });
      if (error) throw error;
    },
    [demoEnabled],
  );

  const refreshBusiness = useCallback(async () => {
    if (demoEnabled) return;
    if (session?.user.id) await loadBusiness(session.user.id);
  }, [session?.user.id, loadBusiness, demoEnabled]);

  // In demo mode the session and business are synthesised from the selected sector, so
  // switching sector re-labels the entire app without any backend round trip.
  const effectiveSession = demoEnabled
    ? ({ user: { id: 'demo-user', email: DEMO_EMAIL } } as unknown as Session)
    : session;

  const effectiveBusiness: Business | null = demoEnabled
    ? {
        id: 'demo-business',
        owner_id: 'demo-user',
        name: DEMO_BUSINESS_NAME,
        sector: demoSector,
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z',
      }
    : business;

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      session: effectiveSession,
      business: effectiveBusiness,
      businessMissing: demoEnabled ? false : businessMissing,
      signUp,
      signIn,
      signOut,
      sendPasswordReset,
      resendConfirmation,
      refreshBusiness,
      demoEnabled,
      demoSector,
      setDemoSector,
    }),
    [
      status,
      effectiveSession,
      effectiveBusiness,
      businessMissing,
      signUp,
      signIn,
      signOut,
      sendPasswordReset,
      resendConfirmation,
      refreshBusiness,
      demoEnabled,
      demoSector,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return context;
}
