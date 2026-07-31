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
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('restoring');
  const [session, setSession] = useState<Session | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [businessMissing, setBusinessMissing] = useState(false);

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
  }, [loadBusiness]);

  const signUp = useCallback(async (input: SignUpInput) => {
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
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    // "Session not found" means the token was already dead. The user asked to sign out
    // and is signed out, so treat it as success rather than trapping them in the app.
    if (error && !/session|not found/i.test(error.message)) throw error;
  }, []);

  const sendPasswordReset = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: 'catch://reset-password',
    });
    if (error) throw error;
  }, []);

  const resendConfirmation = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resend({ type: 'signup', email: email.trim() });
    if (error) throw error;
  }, []);

  const refreshBusiness = useCallback(async () => {
    if (session?.user.id) await loadBusiness(session.user.id);
  }, [session?.user.id, loadBusiness]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      session,
      business,
      businessMissing,
      signUp,
      signIn,
      signOut,
      sendPasswordReset,
      resendConfirmation,
      refreshBusiness,
    }),
    [
      status,
      session,
      business,
      businessMissing,
      signUp,
      signIn,
      signOut,
      sendPasswordReset,
      resendConfirmation,
      refreshBusiness,
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
