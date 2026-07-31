import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { useAuth } from '@/auth/AuthProvider';

/**
 * How this business is wired up: its Catch number, and the systems it is connected to.
 *
 * Both are held in memory. Provisioning a number is a real purchase with a real monthly
 * cost, and connecting a POS is an OAuth grant against the owner's account — neither is
 * something to fake against a live provider, so both are simulated here and labelled as
 * such on screen.
 */

export type NumberStatus = 'none' | 'provisioning' | 'active';

export type CatchNumber = {
  e164: string;
  areaCode: string;
  status: NumberStatus;
  /** Where unanswered calls ring before Catch texts back. */
  forwardTo?: string;
};

type ConnectionsContextValue = {
  number: CatchNumber | null;
  numberStatus: NumberStatus;
  claimNumber: (areaCode: string) => void;
  releaseNumber: () => void;
  setForwardTo: (phone: string | undefined) => void;

  /** Integration ids currently connected. */
  connected: string[];
  isConnected: (id: string) => boolean;
  connect: (id: string) => void;
  disconnect: (id: string) => void;

  isDemoData: boolean;
};

const ConnectionsContext = createContext<ConnectionsContextValue | null>(null);

/** Plausible local numbers per area code, so the demo reads like a real provisioning. */
function sampleNumber(areaCode: string): string {
  return `+1${areaCode}5550${String(100 + (areaCode.charCodeAt(2) % 90))}`;
}

export function ConnectionsProvider({ children }: { children: ReactNode }) {
  const { demoEnabled, demoSector } = useAuth();

  const seedKey = demoEnabled ? demoSector : 'real';
  const [state, setState] = useState<{
    key: string;
    number: CatchNumber | null;
    connected: string[];
  }>(() => ({
    key: seedKey,
    number: demoEnabled
      ? { e164: '+12895550147', areaCode: '289', status: 'active', forwardTo: '+19055551234' }
      : null,
    // One connected and the rest not, so both states are visible at a glance.
    connected: demoEnabled ? ['google_calendar'] : [],
  }));

  if (state.key !== seedKey) {
    setState({
      key: seedKey,
      number: demoEnabled
        ? { e164: '+12895550147', areaCode: '289', status: 'active', forwardTo: '+19055551234' }
        : null,
      connected: demoEnabled ? ['google_calendar'] : [],
    });
  }

  const claimNumber = useCallback((areaCode: string) => {
    setState((prev) => ({
      ...prev,
      number: {
        e164: sampleNumber(areaCode),
        areaCode,
        status: 'active',
        forwardTo: prev.number?.forwardTo,
      },
    }));
  }, []);

  const releaseNumber = useCallback(() => {
    setState((prev) => ({ ...prev, number: null }));
  }, []);

  const setForwardTo = useCallback((phone: string | undefined) => {
    setState((prev) =>
      prev.number ? { ...prev, number: { ...prev.number, forwardTo: phone } } : prev,
    );
  }, []);

  const connect = useCallback((id: string) => {
    setState((prev) =>
      prev.connected.includes(id) ? prev : { ...prev, connected: [...prev.connected, id] },
    );
  }, []);

  const disconnect = useCallback((id: string) => {
    setState((prev) => ({ ...prev, connected: prev.connected.filter((c) => c !== id) }));
  }, []);

  const isConnected = useCallback((id: string) => state.connected.includes(id), [state.connected]);

  const value = useMemo(
    () => ({
      number: state.number,
      numberStatus: state.number?.status ?? 'none',
      claimNumber,
      releaseNumber,
      setForwardTo,
      connected: state.connected,
      isConnected,
      connect,
      disconnect,
      isDemoData: demoEnabled,
    }),
    [
      state.number,
      state.connected,
      claimNumber,
      releaseNumber,
      setForwardTo,
      isConnected,
      connect,
      disconnect,
      demoEnabled,
    ],
  );

  return <ConnectionsContext.Provider value={value}>{children}</ConnectionsContext.Provider>;
}

export function useConnections(): ConnectionsContextValue {
  const context = useContext(ConnectionsContext);
  if (!context) {
    throw new Error('useConnections must be used inside <ConnectionsProvider>');
  }
  return context;
}
