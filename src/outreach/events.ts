import type { SectorId } from '@/sectors/sectors';

/**
 * Business events that can fire an outreach by themselves.
 *
 * These are per sector because the moment worth texting about is not the same trade to
 * trade. A realtor's is a showing slot opening; a salon's is a cancelled chair; a
 * restaurant's is a new item on the menu.
 *
 * An event does not carry a message. It carries the raw material a message is written
 * from — what happened, what the customer is being offered, and an example of the detail
 * that will be filled in at send time. The wording itself is generated per run, in the
 * tone the owner picked, because the real message depends on which listing, which slot,
 * which item.
 */

export type OutreachEvent = {
  id: string;
  label: string;
  /** When this fires, in plain language. Shown in the picker. */
  description: string;
  icon: string;
  /** What happened, as a phrase a sentence can be built around. */
  subject: string;
  /** What the customer is being offered in response. */
  offer: string;
  /**
   * A realistic stand-in for the detail the assistant will pull from the real event.
   * Used only to make the preview concrete — never sent.
   */
  sampleDetail: string;
  /** The word a customer replies to act. Keeps the call to action concrete. */
  keyword: string;
};

/** Cancellation-driven trades: the free slot is the sellable moment. */
function slotEvents(job: string, detail: string): OutreachEvent[] {
  return [
    {
      id: 'slot_opened',
      label: 'A slot opens up',
      description: `Someone cancels and you have ${job} time free`,
      icon: '🕐',
      subject: 'we have had a cancellation',
      offer: 'the free slot',
      sampleDetail: detail,
      keyword: 'YES',
    },
    {
      id: 'new_service',
      label: 'You add a service',
      description: 'A new service is added to your list',
      icon: '✨',
      subject: 'we have added a new service',
      offer: 'the details and pricing',
      sampleDetail: 'Full system check - $89',
      keyword: 'INFO',
    },
    {
      id: 'seasonal_due',
      label: 'Service falls due',
      description: 'A customer is due their regular service again',
      icon: '🔁',
      subject: 'you are about due for your next service',
      offer: 'a booking',
      sampleDetail: 'last visit was 11 months ago',
      keyword: 'BOOK',
    },
  ];
}

const RESTAURANT: OutreachEvent[] = [
  {
    id: 'new_menu_item',
    label: 'New menu item',
    description: 'You add an item to the menu',
    icon: '🍽️',
    subject: 'there is something new on the menu',
    offer: 'the full menu',
    sampleDetail: 'Truffle Pappardelle - $24',
    keyword: 'MENU',
  },
  {
    id: 'tables_free',
    label: 'Tables are free',
    description: 'You mark the night as quiet',
    icon: '🪑',
    subject: 'we have tables free tonight',
    offer: 'a table',
    sampleDetail: 'tonight from 6pm',
    keyword: 'BOOK',
  },
  {
    id: 'booking_cancelled',
    label: 'A booking cancels',
    description: 'A table frees up at short notice',
    icon: '🕐',
    subject: 'a table just opened up',
    offer: 'the table',
    sampleDetail: 'tonight at 7:30pm, party of 4',
    keyword: 'YES',
  },
];

const REAL_ESTATE: OutreachEvent[] = [
  {
    id: 'new_listing',
    label: 'New listing goes live',
    description: 'You add a property to your listings',
    icon: '🏡',
    subject: 'a new listing just went live',
    offer: 'photos and a viewing',
    sampleDetail: '2 Lakeshore Blvd - $749,000, 3 bed',
    keyword: 'INFO',
  },
  {
    id: 'showing_slot',
    label: 'A showing slot opens',
    description: 'A viewing time becomes available on your calendar',
    icon: '🗓️',
    subject: 'a viewing slot just opened up',
    offer: 'the slot',
    sampleDetail: 'Thursday at 4pm, 2 Lakeshore Blvd',
    keyword: 'YES',
  },
  {
    id: 'showing_cancelled',
    label: 'A showing cancels',
    description: 'A booked viewing is cancelled',
    icon: '🕐',
    subject: 'we have had a cancellation on a viewing',
    offer: 'the slot',
    sampleDetail: 'today at 2pm, 41 Ellis Ave',
    keyword: 'YES',
  },
  {
    id: 'price_change',
    label: 'A price changes',
    description: 'You reduce the asking price on a listing',
    icon: '📉',
    subject: 'the price just dropped on a listing you asked about',
    offer: 'the updated details',
    sampleDetail: '41 Ellis Ave - now $689,000, was $725,000',
    keyword: 'INFO',
  },
];

const FITNESS: OutreachEvent[] = [
  {
    id: 'class_spot',
    label: 'A class spot opens',
    description: 'Someone drops out of a full class',
    icon: '🕐',
    subject: 'a spot just opened in a class',
    offer: 'the spot',
    sampleDetail: 'Spin, tonight at 6:30pm',
    keyword: 'YES',
  },
  {
    id: 'new_class',
    label: 'New class added',
    description: 'You add a class to the timetable',
    icon: '✨',
    subject: 'there is a new class on the timetable',
    offer: 'the times',
    sampleDetail: 'Reformer Pilates, Tuesdays 7pm',
    keyword: 'INFO',
  },
  {
    id: 'membership_lapsing',
    label: 'A membership lapses',
    description: 'A membership is about to run out',
    icon: '🔁',
    subject: 'your membership runs out this week',
    offer: 'a renewal',
    sampleDetail: 'expires Friday',
    keyword: 'RENEW',
  },
];

const SALON: OutreachEvent[] = [
  {
    id: 'chair_opened',
    label: 'A chair opens up',
    description: 'An appointment is cancelled',
    icon: '🕐',
    subject: 'we have had a cancellation',
    offer: 'the appointment',
    sampleDetail: 'today at 3pm with Dana',
    keyword: 'YES',
  },
  {
    id: 'new_treatment',
    label: 'New treatment added',
    description: 'You add a treatment to your list',
    icon: '✨',
    subject: 'we have added a new treatment',
    offer: 'details and pricing',
    sampleDetail: 'Hydrafacial - $110',
    keyword: 'INFO',
  },
  {
    id: 'rebook_due',
    label: 'Time to rebook',
    description: 'A regular customer is due back',
    icon: '🔁',
    subject: 'you are about due for your next appointment',
    offer: 'a booking',
    sampleDetail: 'last visit was 7 weeks ago',
    keyword: 'BOOK',
  },
];

const BY_SECTOR: Partial<Record<SectorId, OutreachEvent[]>> = {
  restaurant: RESTAURANT,
  real_estate: REAL_ESTATE,
  fitness: FITNESS,
  salon_spa: SALON,
  hvac: slotEvents('a service call', 'today at 2pm'),
  plumbing: slotEvents('a call-out', 'today at 11am'),
  electrical: slotEvents('a job', 'tomorrow morning'),
  auto_repair: slotEvents('a bay', 'today at 1pm'),
};

/** Neutral fallback for a sector this build does not recognise. */
const GENERIC = slotEvents('an appointment', 'today at 2pm');

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
