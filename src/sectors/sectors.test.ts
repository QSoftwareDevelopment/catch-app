import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { SECTORS, SECTOR_IDS, getSector, isSectorId, sectorLabel } from './sectors';

describe('sector config', () => {
  it('has metadata for every id, and no extras', () => {
    expect(SECTORS.map((s) => s.id).sort()).toEqual([...SECTOR_IDS].sort());
  });

  it('has no duplicate ids', () => {
    expect(new Set(SECTOR_IDS).size).toBe(SECTOR_IDS.length);
  });

  it('gives every sector a label and a blurb', () => {
    for (const sector of SECTORS) {
      expect(sector.label.trim().length).toBeGreaterThan(0);
      expect(sector.blurb.trim().length).toBeGreaterThan(0);
      expect(sector.icon.trim().length).toBeGreaterThan(0);
    }
  });
});

describe('lookup helpers', () => {
  it('recognises known ids and rejects everything else', () => {
    expect(isSectorId('hvac')).toBe(true);
    expect(isSectorId('HVAC')).toBe(false);
    expect(isSectorId('crypto')).toBe(false);
    expect(isSectorId(null)).toBe(false);
    expect(isSectorId(42)).toBe(false);
  });

  it('falls back to a generic label for an unknown sector', () => {
    // The backend can gain a sector before an installed app knows about it. That must
    // render as "Business", not crash or print a raw id.
    expect(sectorLabel('hvac')).toBe('HVAC');
    expect(sectorLabel('sector_from_the_future')).toBe('Business');
    expect(sectorLabel(null)).toBe('Business');
    expect(getSector(undefined)).toBeUndefined();
  });
});

describe('database constraint stays in sync', () => {
  // Sector drives feature gating and pricing. If the app offers a sector Postgres will
  // not accept, signup fails at the trigger with a raw error; if Postgres accepts one the
  // app does not know, the owner sees "Business" and gets no features. Both are silent
  // until a real business hits them, so the two lists are asserted equal here.
  const migration = readFileSync(
    join(__dirname, '../../supabase/migrations/0001_businesses.sql'),
    'utf8',
  );

  function sectorsInBlock(block: string): string[] {
    return [...block.matchAll(/'([a-z_]+)'/g)].map((match) => match[1]).sort();
  }

  it('lists exactly the config sectors in the check constraint', () => {
    const constraint = migration.match(/businesses_sector_check check \(\s*sector in \(([^)]*)\)/);
    expect(constraint).not.toBeNull();
    expect(sectorsInBlock(constraint![1])).toEqual([...SECTOR_IDS].sort());
  });

  it('lists exactly the config sectors in the signup trigger', () => {
    const guard = migration.match(/if v_sector not in \(([^)]*)\)/);
    expect(guard).not.toBeNull();
    expect(sectorsInBlock(guard![1])).toEqual([...SECTOR_IDS].sort());
  });
});
