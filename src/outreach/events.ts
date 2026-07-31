import type { SectorId } from '@/sectors/sectors';

/**
 * Business events that can fire an outreach by themselves.
 *
 * These are per sector because the moment worth texting about is not the same trade to
 * trade. A realtor's is a showing slot opening; a salon's is a cancelled chair; a
 * restaurant's is a new item on the menu. Offering a plumber "new menu item" would make
 * the whole feature look like it was built for somebody else.
 *
 * Each event carries a suggested message so an owner never faces an empty box — the
 * blank composer is where most campaigns die.
 */

export type OutreachEvent = {
  id: string;
  label: string;
  /** When this fires, in plain language. */
  description: string;
  icon: string;
  /** Pre-filled into the composer. Editable. */
  suggestedMessage: string;
};

/** Cancellation-driven trades: the free slot is the sellable moment. */
function slotEvents(job: string): OutreachEvent[] {
  return [
    {
      id: 'slot_opened',
      label: 'A slot opens up',
      description: `Someone cancels and you have ${job} time free`,
      icon: '🕐',
      suggestedMessage: `We've had a cancellation — we can fit you in today. Reply YES and we'll hold it for you.`,
    },
    {
      id: 'new_service',
      label: 'You add a service',
      description: 'A new service is added to your list',
      icon: '✨',
      suggestedMessage: `We've just added something new. Reply INFO and I'll send the details and pricing.`,
    },
    {
      id: 'seasonal_due',
      label: 'Service falls due',
      description: 'A customer is due their regular service again',
      icon: '🔁',
      suggestedMessage: `You're about due for your next service. Want me to book you in?`,
    },
  ];
}

const RESTAURANT: OutreachEvent[] = [
  {
    id: 'new_menu_item',
    label: 'New menu item',
    description: 'You add an item to the menu',
    icon: '🍽️',
    suggestedMessage: `New on the menu today. Reply MENU and I'll send it over.`,
  },
  {
    id: 'tables_free',
    label: 'Tables are free',
    description: 'You mark the night as quiet',
    icon: '🪑',
    suggestedMessage: `We've got tables free tonight. Reply BOOK and I'll hold one for you.`,
  },
  {
    id: 'booking_cancelled',
    label: 'A booking cancels',
    description: 'A table frees up at short notice',
    icon: '🕐',
    suggestedMessage: `A table just opened up tonight. Reply YES and it's yours.`,
  },
];

const REAL_ESTATE: OutreachEvent[] = [
  {
    id: 'new_listing',
    label: 'New listing goes live',
    description: 'You add a property to your listings',
    icon: '🏡',
    suggestedMessage: `New listing just went live in your area. Reply INFO for photos and the asking price.`,
  },
  {
    id: 'showing_slot',
    label: 'A showing slot opens',
    description: 'A viewing time becomes available on your calendar',
    icon: '🗓️',
    suggestedMessage: `A viewing slot just opened up. Reply YES and I'll book you in.`,
  },
  {
    id: 'showing_cancelled',
    label: 'A showing cancels',
    description: 'A booked viewing is cancelled',
    icon: '🕐',
    suggestedMessage: `We've had a cancellation on a viewing today. Want the slot?`,
  },
  {
    id: 'price_change',
    label: 'A price changes',
    description: 'You reduce the asking price on a listing',
    icon: '📉',
    suggestedMessage: `Price just dropped on a listing you asked about. Reply INFO for the details.`,
  },
];

const FITNESS: OutreachEvent[] = [
  {
    id: 'class_spot',
    label: 'A class spot opens',
    description: 'Someone drops out of a full class',
    icon: '🕐',
    suggestedMessage: `A spot just opened in today's class. Reply YES to take it.`,
  },
  {
    id: 'new_class',
    label: 'New class added',
    description: 'You add a class to the timetable',
    icon: '✨',
    suggestedMessage: `New class on the timetable this week. Reply INFO for times.`,
  },
  {
    id: 'membership_lapsing',
    label: 'A membership lapses',
    description: 'A membership is about to run out',
    icon: '🔁',
    suggestedMessage: `Your membership runs out this week. Reply RENEW to keep it going.`,
  },
];

const SALON: OutreachEvent[] = [
  {
    id: 'chair_opened',
    label: 'A chair opens up',
    description: 'An appointment is cancelled',
    icon: '🕐',
    suggestedMessage: `We've had a cancellation today. Reply YES and the slot is yours.`,
  },
  {
    id: 'new_treatment',
    label: 'New treatment added',
    description: 'You add a treatment to your list',
    icon: '✨',
    suggestedMessage: `We've added a new treatment. Reply INFO for details and pricing.`,
  },
  {
    id: 'rebook_due',
    label: 'Time to rebook',
    description: 'A regular customer is due back',
    icon: '🔁',
    suggestedMessage: `You're about due for your next appointment. Want me to book you in?`,
  },
];

const BY_SECTOR: Partial<Record<SectorId, OutreachEvent[]>> = {
  restaurant: RESTAURANT,
  real_estate: REAL_ESTATE,
  fitness: FITNESS,
  salon_spa: SALON,
  hvac: slotEvents('a service call'),
  plumbing: slotEvents('a call-out'),
  electrical: slotEvents('a job'),
  auto_repair: slotEvents('a bay'),
};

/** Neutral fallback for a sector this build does not recognise. */
const GENERIC = slotEvents('an appointment');

export function eventsForSector(sector: string | null | undefined): OutreachEvent[] {
  return BY_SECTOR[sector as SectorId] ?? GENERIC;
}

export function findEvent(
  sector: string | null | undefined,
  eventId: string | undefined,
): OutreachEvent | undefined {
  if (!eventId) return undefined;
  return eventsForSector(sector).find((e) => e.id === eventId);
}

/**
 * Label for an event that may belong to a sector the business has since left, or to a
 * build that does not know it. Never renders a raw id at the user.
 */
export function eventLabel(
  sector: string | null | undefined,
  eventId: string | undefined,
): string {
  return findEvent(sector, eventId)?.label ?? 'A business event';
}
