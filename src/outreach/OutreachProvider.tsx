import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { useAuth } from '@/auth/AuthProvider';

import { eventsForSector } from './events';
import type { Campaign, CampaignStatus } from './types';

/**
 * Campaign store for the session.
 *
 * Seeded in demo mode with one campaign of each trigger type, so the three modes can be
 * seen side by side. Empty otherwise — there is no scheduler and no SMS gateway, and a
 * campaign that looks armed but never fires would be worse than no campaign at all.
 */

type OutreachContextValue = {
  campaigns: Campaign[];
  getCampaign: (id: string) => Campaign | undefined;
  addCampaign: (input: Omit<Campaign, 'id' | 'createdAt' | 'status'> & {
    status?: CampaignStatus;
  }) => Campaign;
  setStatus: (id: string, status: CampaignStatus) => void;
  /**
   * Edit an existing campaign, including one that is live.
   *
   * Status is never changed here. Saving an edit must not silently arm a paused
   * campaign or disarm a live one — turning it on and off stays an explicit action.
   */
  updateCampaign: (id: string, patch: Partial<Omit<Campaign, 'id' | 'createdAt' | 'status'>>) => void;
  removeCampaign: (id: string) => void;
  /** Records a manual send. No gateway — marks it sent so the flow completes. */
  markSent: (id: string, recipients: number) => void;
  isDemoData: boolean;
};

const OutreachContext = createContext<OutreachContextValue | null>(null);

function seedCampaigns(sector: string | null | undefined): Campaign[] {
  const events = eventsForSector(sector);
  const firstEvent = events[0];
  const now = Date.now();

  return [
    {
      id: 'demo_camp_0',
      name: 'Weekly voucher',
      triggerType: 'scheduled',
      audienceId: 'recent',
      messageMode: 'custom',
      message: 'Order NOW for 50% off — this hour only.',
      schedule: { weekday: 5, hour: 17, minute: 0 },
      status: 'active',
      createdAt: new Date(now - 12 * 24 * 60 * 60 * 1000).toISOString(),
      lastRunAt: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(),
      lastRunCount: 3,
    },
    {
      // The one that shows generation off: no stored wording, just a voice.
      id: 'demo_camp_1',
      name: firstEvent?.label ?? 'Slot opens up',
      triggerType: 'event',
      audienceId: 'lapsed',
      messageMode: 'generated',
      tone: 'friendly',
      eventId: firstEvent?.id,
      status: 'active',
      createdAt: new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'demo_camp_2',
      name: 'Long weekend hours',
      triggerType: 'manual',
      audienceId: 'everyone',
      messageMode: 'custom',
      message: "We're open all weekend — reply BOOK if you want a slot.",
      status: 'sent',
      createdAt: new Date(now - 9 * 24 * 60 * 60 * 1000).toISOString(),
      lastRunAt: new Date(now - 9 * 24 * 60 * 60 * 1000).toISOString(),
      lastRunCount: 4,
    },
  ];
}

let sequence = 0;

export function OutreachProvider({ children }: { children: ReactNode }) {
  const { demoEnabled, demoSector } = useAuth();

  const seedKey = demoEnabled ? demoSector : 'real';
  const [state, setState] = useState<{ key: string; items: Campaign[] }>(() => ({
    key: seedKey,
    items: demoEnabled ? seedCampaigns(demoSector) : [],
  }));

  if (state.key !== seedKey) {
    // Switching sector swaps in that trade's event campaign.
    setState({ key: seedKey, items: demoEnabled ? seedCampaigns(demoSector) : [] });
  }

  const campaigns = state.items;

  const getCampaign = useCallback(
    (id: string) => campaigns.find((c) => c.id === id),
    [campaigns],
  );

  const addCampaign = useCallback<OutreachContextValue['addCampaign']>((input) => {
    sequence += 1;
    const campaign: Campaign = {
      ...input,
      id: `camp_${Date.now().toString(36)}_${sequence}`,
      createdAt: new Date().toISOString(),
      status: input.status ?? 'draft',
    };
    setState((prev) => ({ ...prev, items: [campaign, ...prev.items] }));
    return campaign;
  }, []);

  const setStatus = useCallback((id: string, status: CampaignStatus) => {
    setState((prev) => ({
      ...prev,
      items: prev.items.map((c) => (c.id === id ? { ...c, status } : c)),
    }));
  }, []);

  const updateCampaign = useCallback<OutreachContextValue['updateCampaign']>((id, patch) => {
    setState((prev) => ({
      ...prev,
      items: prev.items.map((c) => {
        if (c.id !== id) return c;

        const next = { ...c, ...patch };

        // Fields only make sense for one shape of campaign. Leaving a stale schedule on
        // a campaign switched to event, or a stale eventId on one switched to
        // scheduled, would have it fire on the wrong condition.
        if (next.triggerType !== 'scheduled') next.schedule = undefined;
        if (next.triggerType !== 'event') next.eventId = undefined;
        if (next.messageMode === 'custom') {
          next.tone = undefined;
          next.guidance = undefined;
        } else {
          next.message = undefined;
        }

        return next;
      }),
    }));
  }, []);

  const removeCampaign = useCallback((id: string) => {
    setState((prev) => ({ ...prev, items: prev.items.filter((c) => c.id !== id) }));
  }, []);

  const markSent = useCallback((id: string, recipients: number) => {
    const at = new Date().toISOString();
    setState((prev) => ({
      ...prev,
      items: prev.items.map((c) =>
        c.id === id ? { ...c, status: 'sent', lastRunAt: at, lastRunCount: recipients } : c,
      ),
    }));
  }, []);

  const value = useMemo(
    () => ({
      campaigns,
      getCampaign,
      addCampaign,
      setStatus,
      updateCampaign,
      removeCampaign,
      markSent,
      isDemoData: demoEnabled,
    }),
    [
      campaigns,
      getCampaign,
      addCampaign,
      setStatus,
      updateCampaign,
      removeCampaign,
      markSent,
      demoEnabled,
    ],
  );

  return <OutreachContext.Provider value={value}>{children}</OutreachContext.Provider>;
}

export function useOutreach(): OutreachContextValue {
  const context = useContext(OutreachContext);
  if (!context) {
    throw new Error('useOutreach must be used inside <OutreachProvider>');
  }
  return context;
}
