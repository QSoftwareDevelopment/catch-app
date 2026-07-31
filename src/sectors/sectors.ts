/**
 * The sectors Catch sells into.
 *
 * Sector is the axis the whole product pivots on: it decides which features a business
 * sees and, later, what it is charged. It is captured during signup and stored on the
 * `businesses` row.
 *
 * This list is the single source of truth. The `sector` check constraint in
 * `supabase/migrations/0001_businesses.sql` mirrors it, and a test asserts the two stay
 * in sync. Adding a sector means editing this file *and* writing a migration that widens
 * the constraint — the test fails until both are done.
 */

export const SECTOR_IDS = [
  'hvac',
  'plumbing',
  'electrical',
  'restaurant',
  'real_estate',
  'auto_repair',
  'salon_spa',
  'fitness',
] as const;

export type SectorId = (typeof SECTOR_IDS)[number];

export type Sector = {
  id: SectorId;
  label: string;
  /** Shown under the label in the picker. Frames what texting unlocks for this trade. */
  blurb: string;
  /** Emoji stands in until the design system has real icons. */
  icon: string;
  /**
   * What this sector sells, in its own words. Drives the "Our ___" tile on the home
   * screen and the catalog screen's title.
   *
   * A restaurant does not have "services" and a realtor does not have "menu items";
   * using the trade's own noun is the difference between the app feeling built for them
   * and feeling like generic software. This is the first place sector actually changes
   * the product rather than just labelling it.
   */
  catalogSingular: string;
  catalogPlural: string;
  /**
   * The one document this trade is most likely to already have lying around — the thing
   * to name on the scan button. A restaurant has a menu; a realtor has a listing sheet;
   * an HVAC company has a price sheet. Asking a plumber to "scan your menu" is the kind
   * of detail that makes software feel like it was built for someone else.
   */
  documentPrimary: string;
  /** Two or three documents this trade could upload, for the explanatory copy. */
  documentExamples: string;
};

export const SECTORS: readonly Sector[] = [
  {
    id: 'hvac',
    label: 'HVAC',
    blurb: 'Quote jobs and book service calls over text',
    icon: '🔧',
    catalogSingular: 'Service',
    catalogPlural: 'Services',
    documentPrimary: 'price sheet',
    documentExamples: 'price sheet, service list, or maintenance plan',
  },
  {
    id: 'plumbing',
    label: 'Plumbing',
    blurb: 'Handle emergency calls and dispatch by text',
    icon: '🚿',
    catalogSingular: 'Service',
    catalogPlural: 'Services',
    documentPrimary: 'price sheet',
    documentExamples: 'price sheet, call-out rates, or service list',
  },
  {
    id: 'electrical',
    label: 'Electrical',
    blurb: 'Estimate work and schedule visits by text',
    icon: '⚡',
    catalogSingular: 'Service',
    catalogPlural: 'Services',
    documentPrimary: 'rate sheet',
    documentExamples: 'rate sheet, service list, or safety-check pricing',
  },
  {
    id: 'restaurant',
    label: 'Restaurant',
    blurb: 'Take orders and reservations by text',
    icon: '🍽️',
    catalogSingular: 'Menu Item',
    catalogPlural: 'Menu Items',
    documentPrimary: 'menu',
    documentExamples: 'menu, specials board, or takeaway price list',
  },
  {
    id: 'real_estate',
    label: 'Real Estate',
    blurb: 'Qualify leads and book showings by text',
    icon: '🏡',
    catalogSingular: 'Property Listing',
    catalogPlural: 'Property Listings',
    documentPrimary: 'listing sheet',
    documentExamples: 'listing sheet, feature list, or open-house flyer',
  },
  {
    id: 'auto_repair',
    label: 'Auto Repair',
    blurb: 'Send estimates and pickup alerts by text',
    icon: '🚗',
    catalogSingular: 'Service',
    catalogPlural: 'Services',
    documentPrimary: 'service menu',
    documentExamples: 'service menu, labour rates, or parts price list',
  },
  {
    id: 'salon_spa',
    label: 'Salon & Spa',
    blurb: 'Fill your book and cut no-shows by text',
    icon: '💇',
    catalogSingular: 'Service',
    catalogPlural: 'Services',
    documentPrimary: 'service menu',
    documentExamples: 'service menu, treatment list, or price card',
  },
  {
    id: 'fitness',
    label: 'Fitness',
    blurb: 'Sell memberships and class packs by text',
    icon: '🏋️',
    // "Membership / Class" reads badly inside a sentence, so the plural is phrased
    // rather than mechanically derived.
    catalogSingular: 'Membership or Class',
    catalogPlural: 'Memberships & Classes',
    documentPrimary: 'membership plan',
    documentExamples: 'membership plans, class timetable, or price list',
  },
];

const SECTORS_BY_ID = new Map<string, Sector>(SECTORS.map((s) => [s.id, s]));

export function isSectorId(value: unknown): value is SectorId {
  return typeof value === 'string' && SECTORS_BY_ID.has(value);
}

/** Returns the sector, or undefined for an id this build does not know about. */
export function getSector(id: string | null | undefined): Sector | undefined {
  return id == null ? undefined : SECTORS_BY_ID.get(id);
}

/**
 * A human label for a sector id, safe against ids this build has never heard of —
 * which happens when the backend gains a sector before the app updates.
 */
export function sectorLabel(id: string | null | undefined): string {
  return getSector(id)?.label ?? 'Business';
}

/** Fallbacks for a sector this build does not recognise, or a business with none set. */
const GENERIC_CATALOG = { singular: 'Offering', plural: 'Offerings' } as const;

/** What this sector sells, plural — "Services", "Menu Items", "Property Listings". */
export function catalogPlural(id: string | null | undefined): string {
  return getSector(id)?.catalogPlural ?? GENERIC_CATALOG.plural;
}

/** What this sector sells, singular. Used for empty states and add buttons. */
export function catalogSingular(id: string | null | undefined): string {
  return getSector(id)?.catalogSingular ?? GENERIC_CATALOG.singular;
}

/**
 * The document this trade most likely already has — "menu", "price sheet",
 * "listing sheet". Names the scan action in the trade's own words.
 */
export function documentPrimary(id: string | null | undefined): string {
  return getSector(id)?.documentPrimary ?? 'price list';
}

/** Documents this trade could upload, for explanatory copy. */
export function documentExamples(id: string | null | undefined): string {
  return getSector(id)?.documentExamples ?? 'price list, service list, or brochure';
}
