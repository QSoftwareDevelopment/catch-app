import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { useAuth } from '@/auth/AuthProvider';

import { demoConversations } from './demoData';
import type { Conversation, ConversationStatus } from './types';

/**
 * Holds the inbox for the session.
 *
 * In demo mode it seeds realistic threads for the current sector so the screen can be
 * reviewed. Outside demo mode it is empty and stays empty — there is no messaging
 * backend yet, and inventing conversations for a real business would be worse than
 * showing nothing.
 */

type ConversationsContextValue = {
  conversations: Conversation[];
  getConversation: (id: string) => Conversation | undefined;
  setStatus: (id: string, status: ConversationStatus) => void;
  setBlocked: (id: string, blocked: boolean) => void;
  /** Sends as the owner. No network — appends locally so the flow can be walked. */
  sendMessage: (id: string, body: string) => void;
  /** True when threads are fabricated. Screens use it to say so. */
  isDemoData: boolean;
};

const ConversationsContext = createContext<ConversationsContextValue | null>(null);

export function ConversationsProvider({ children }: { children: ReactNode }) {
  const { demoEnabled, demoSector, business } = useAuth();

  // Seeded once per sector. Re-seeding on every render would discard a status the
  // reviewer had just changed.
  const seedKey = demoEnabled ? demoSector : 'real';
  const [seeded, setSeeded] = useState<{ key: string; items: Conversation[] }>(() => ({
    key: seedKey,
    items: demoEnabled ? demoConversations(demoSector) : [],
  }));

  if (seeded.key !== seedKey) {
    // Switching sector in the demo switcher should swap the threads to match.
    setSeeded({
      key: seedKey,
      items: demoEnabled ? demoConversations(demoSector) : [],
    });
  }

  const conversations = seeded.items;

  const update = useCallback((id: string, patch: Partial<Conversation>) => {
    setSeeded((prev) => ({
      ...prev,
      items: prev.items.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    }));
  }, []);

  const getConversation = useCallback(
    (id: string) => conversations.find((c) => c.id === id),
    [conversations],
  );

  const setStatus = useCallback(
    (id: string, status: ConversationStatus) => update(id, { status }),
    [update],
  );

  const setBlocked = useCallback(
    (id: string, blocked: boolean) => {
      // Blocking a number is also the end of the conversation; leaving it "active"
      // would keep it in the working list the owner is trying to clear.
      update(id, blocked ? { blocked, status: 'closed' } : { blocked });
    },
    [update],
  );

  const sendMessage = useCallback(
    (id: string, body: string) => {
      const trimmed = body.trim();
      if (!trimmed) return;
      const at = new Date().toISOString();

      setSeeded((prev) => ({
        ...prev,
        items: prev.items.map((c) =>
          c.id === id
            ? {
                ...c,
                updatedAt: at,
                // Replying to a closed thread reopens it — that is what replying means.
                status: 'active',
                messages: [
                  ...c.messages,
                  { id: `local_${c.messages.length}_${at}`, author: 'owner', body: trimmed, at },
                ],
              }
            : c,
        ),
      }));
    },
    [],
  );

  const value = useMemo(
    () => ({
      conversations,
      getConversation,
      setStatus,
      setBlocked,
      sendMessage,
      isDemoData: demoEnabled,
    }),
    [conversations, getConversation, setStatus, setBlocked, sendMessage, demoEnabled],
  );

  // `business` is read so the provider re-seeds if the signed-in business ever changes.
  void business;

  return (
    <ConversationsContext.Provider value={value}>{children}</ConversationsContext.Provider>
  );
}

export function useConversations(): ConversationsContextValue {
  const context = useContext(ConversationsContext);
  if (!context) {
    throw new Error('useConversations must be used inside <ConversationsProvider>');
  }
  return context;
}
