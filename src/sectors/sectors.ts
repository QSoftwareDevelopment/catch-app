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
};

export const SECTORS: readonly Sector[] = [
  {
    id: 'hvac',
    label: 'HVAC',
    blurb: 'Quote jobs and book service calls over text',
    icon: '🔧',
  },
  {
    id: 'plumbing',
    label: 'Plumbing',
    blurb: 'Handle emergency calls and dispatch by text',
    icon: '🚿',
  },
  {
    id: 'electrical',
    label: 'Electrical',
    blurb: 'Estimate work and schedule visits by text',
    icon: '⚡',
  },
  {
    id: 'restaurant',
    label: 'Restaurant',
    blurb: 'Take orders and reservations by text',
    icon: '🍽️',
  },
  {
    id: 'real_estate',
    label: 'Real Estate',
    blurb: 'Qualify leads and book showings by text',
    icon: '🏡',
  },
  {
    id: 'auto_repair',
    label: 'Auto Repair',
    blurb: 'Send estimates and pickup alerts by text',
    icon: '🚗',
  },
  {
    id: 'salon_spa',
    label: 'Salon & Spa',
    blurb: 'Fill your book and cut no-shows by text',
    icon: '💇',
  },
  {
    id: 'fitness',
    label: 'Fitness',
    blurb: 'Sell memberships and class packs by text',
    icon: '🏋️',
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
