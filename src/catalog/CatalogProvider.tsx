import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { nextSourceId, type CatalogSource } from './sources';

/**
 * Holds captured business-context sources for the session.
 *
 * In-memory on purpose. Persisting to Supabase Storage needs the schema work that is
 * still blocked, and writing a half-finished upload path now would mean two migrations
 * later. Lives above the screens so a source survives navigating away and back.
 */

type CatalogContextValue = {
  sources: CatalogSource[];
  addSource: (source: Omit<CatalogSource, 'id' | 'addedAt' | 'status'>) => CatalogSource;
  removeSource: (id: string) => void;
  clearSources: () => void;
};

const CatalogContext = createContext<CatalogContextValue | null>(null);

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [sources, setSources] = useState<CatalogSource[]>([]);

  const addSource = useCallback(
    (input: Omit<CatalogSource, 'id' | 'addedAt' | 'status'>) => {
      const source: CatalogSource = {
        ...input,
        id: nextSourceId(),
        addedAt: new Date().toISOString(),
        status: 'pending',
      };
      // Newest first: after adding something the confirmation should be at the top of
      // the list rather than below everything added previously.
      setSources((prev) => [source, ...prev]);
      return source;
    },
    [],
  );

  const removeSource = useCallback((id: string) => {
    setSources((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const clearSources = useCallback(() => setSources([]), []);

  const value = useMemo(
    () => ({ sources, addSource, removeSource, clearSources }),
    [sources, addSource, removeSource, clearSources],
  );

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog(): CatalogContextValue {
  const context = useContext(CatalogContext);
  if (!context) {
    throw new Error('useCatalog must be used inside <CatalogProvider>');
  }
  return context;
}
