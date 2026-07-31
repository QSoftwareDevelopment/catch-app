import type { SectorId } from '@/sectors/sectors';

/**
 * Systems Catch can connect to.
 *
 * The point of connecting is that the assistant stops guessing. A restaurant's POS knows
 * the real menu and the real prices; a salon's booking system knows which chairs are
 * free. Without a connection the owner has to upload a price sheet by hand and keep it
 * current, which nobody does past the first week.
 *
 * Connections are also what make event triggers real — "a showing slot opens" has to
 * come from a calendar, not from someone remembering to tap a button.
 *
 * Offered per sector, because a plumber has no use for a reservations platform and a
 * restaurant has none for a field-service dispatcher.
 */

export type IntegrationCategory = 'pos' | 'booking' | 'calendar' | 'accounting';

export const CATEGORY_LABELS: Record<IntegrationCategory, string> = {
  pos: 'Point of sale',
  booking: 'Bookings',
  calendar: 'Calendar',
  accounting: 'Accounting',
};

export type Integration = {
  id: string;
  name: string;
  /** What connecting it actually buys the owner. */
  blurb: string;
  icon: string;
  category: IntegrationCategory;
  /** Sectors this is offered to. 'all' means every sector. */
  sectors: readonly SectorId[] | 'all';
};

export const INTEGRATIONS: readonly Integration[] = [
  // --- Point of sale -------------------------------------------------------
  {
    id: 'square',
    name: 'Square',
    blurb: 'Pull in your catalogue and send payment links in a text',
    icon: '⬛',
    category: 'pos',
    sectors: ['restaurant', 'salon_spa', 'auto_repair', 'fitness'],
  },
  {
    id: 'toast',
    name: 'Toast',
    blurb: 'Keep the menu and prices in sync automatically',
    icon: '🍞',
    category: 'pos',
    sectors: ['restaurant'],
  },
  {
    id: 'clover',
    name: 'Clover',
    blurb: 'Sync your items and take payment over text',
    icon: '🍀',
    category: 'pos',
    sectors: ['restaurant', 'salon_spa'],
  },
  {
    id: 'lightspeed',
    name: 'Lightspeed',
    blurb: 'Keep menu changes flowing through to your assistant',
    icon: '⚡',
    category: 'pos',
    sectors: ['restaurant'],
  },

  // --- Bookings ------------------------------------------------------------
  {
    id: 'opentable',
    name: 'OpenTable',
    blurb: 'See free tables and book them straight from a thread',
    icon: '🍽️',
    category: 'booking',
    sectors: ['restaurant'],
  },
  {
    id: 'vagaro',
    name: 'Vagaro',
    blurb: 'Fill cancellations the moment a chair frees up',
    icon: '💇',
    category: 'booking',
    sectors: ['salon_spa'],
  },
  {
    id: 'fresha',
    name: 'Fresha',
    blurb: 'Sync appointments and rebook regulars by text',
    icon: '🌿',
    category: 'booking',
    sectors: ['salon_spa'],
  },
  {
    id: 'mindbody',
    name: 'Mindbody',
    blurb: 'Sell memberships and fill class spots automatically',
    icon: '🧘',
    category: 'booking',
    sectors: ['fitness'],
  },
  {
    id: 'jobber',
    name: 'Jobber',
    blurb: 'Turn a text into a scheduled job and a quote',
    icon: '🧰',
    category: 'booking',
    sectors: ['hvac', 'plumbing', 'electrical'],
  },
  {
    id: 'servicetitan',
    name: 'ServiceTitan',
    blurb: 'Dispatch from a conversation and fill cancelled slots',
    icon: '🔧',
    category: 'booking',
    sectors: ['hvac', 'plumbing', 'electrical'],
  },
  {
    id: 'housecall_pro',
    name: 'Housecall Pro',
    blurb: 'Book jobs and send estimates without leaving the thread',
    icon: '🏠',
    category: 'booking',
    sectors: ['hvac', 'plumbing', 'electrical'],
  },
  {
    id: 'tekmetric',
    name: 'Tekmetric',
    blurb: 'Send estimates and pickup alerts from your shop system',
    icon: '🚗',
    category: 'booking',
    sectors: ['auto_repair'],
  },
  {
    id: 'follow_up_boss',
    name: 'Follow Up Boss',
    blurb: 'Sync leads and log every text against the right contact',
    icon: '📇',
    category: 'booking',
    sectors: ['real_estate'],
  },

  // --- Calendar ------------------------------------------------------------
  {
    id: 'google_calendar',
    name: 'Google Calendar',
    blurb: 'Fire outreach when a slot opens or a booking cancels',
    icon: '📅',
    category: 'calendar',
    sectors: 'all',
  },

  // --- Accounting ----------------------------------------------------------
  {
    id: 'quickbooks',
    name: 'QuickBooks',
    blurb: 'Match payments to customers without re-keying anything',
    icon: '📗',
    category: 'accounting',
    sectors: 'all',
  },
];

/** Integrations offered to a sector, in a stable display order. */
export function integrationsForSector(sector: string | null | undefined): Integration[] {
  const order: IntegrationCategory[] = ['pos', 'booking', 'calendar', 'accounting'];

  return INTEGRATIONS.filter(
    (i) => i.sectors === 'all' || (i.sectors as readonly string[]).includes(sector ?? ''),
  ).sort((a, b) => order.indexOf(a.category) - order.indexOf(b.category));
}

export function findIntegration(id: string): Integration | undefined {
  return INTEGRATIONS.find((i) => i.id === id);
}

export function integrationName(id: string): string {
  return findIntegration(id)?.name ?? 'Unknown app';
}
