import { SECTOR_IDS } from '@/sectors/sectors';

import {
  CATEGORY_LABELS,
  INTEGRATIONS,
  findIntegration,
  integrationName,
  integrationsForSector,
} from './integrations';

describe('integration catalogue', () => {
  it('has unique ids', () => {
    expect(new Set(INTEGRATIONS.map((i) => i.id)).size).toBe(INTEGRATIONS.length);
  });

  it('gives every integration a name, blurb and known category', () => {
    for (const integration of INTEGRATIONS) {
      expect(integration.name.trim().length).toBeGreaterThan(0);
      expect(integration.blurb.trim().length).toBeGreaterThan(10);
      expect(CATEGORY_LABELS[integration.category]).toBeDefined();
    }
  });

  it('only lists sectors that exist', () => {
    // A typo'd sector id would silently hide an integration from the trade that needs it.
    for (const integration of INTEGRATIONS) {
      if (integration.sectors === 'all') continue;
      for (const sector of integration.sectors) {
        expect(SECTOR_IDS).toContain(sector);
      }
    }
  });
});

describe('integrationsForSector', () => {
  it('offers each trade the systems it would actually run', () => {
    const restaurant = integrationsForSector('restaurant').map((i) => i.id);
    expect(restaurant).toContain('square');
    expect(restaurant).toContain('toast');
    expect(restaurant).toContain('opentable');

    const plumbing = integrationsForSector('plumbing').map((i) => i.id);
    expect(plumbing).toContain('jobber');
    expect(plumbing).toContain('servicetitan');

    expect(integrationsForSector('salon_spa').map((i) => i.id)).toContain('vagaro');
    expect(integrationsForSector('fitness').map((i) => i.id)).toContain('mindbody');
    expect(integrationsForSector('real_estate').map((i) => i.id)).toContain('follow_up_boss');
  });

  it('does not offer a plumber a reservations platform', () => {
    // The same tell as elsewhere: offering irrelevant integrations makes the product
    // look like it was built for a different trade.
    const plumbing = integrationsForSector('plumbing').map((i) => i.id);
    expect(plumbing).not.toContain('opentable');
    expect(plumbing).not.toContain('toast');

    const restaurant = integrationsForSector('restaurant').map((i) => i.id);
    expect(restaurant).not.toContain('servicetitan');
    expect(restaurant).not.toContain('tekmetric');
  });

  it('offers the universal ones to everybody', () => {
    for (const sector of SECTOR_IDS) {
      const ids = integrationsForSector(sector).map((i) => i.id);
      expect(ids).toContain('google_calendar');
      expect(ids).toContain('quickbooks');
    }
  });

  it('gives every sector something beyond the universal two', () => {
    // A sector with only the generic options has no reason to open the screen.
    for (const sector of SECTOR_IDS) {
      expect(integrationsForSector(sector).length).toBeGreaterThan(2);
    }
  });

  it('groups point of sale before accounting', () => {
    const categories = integrationsForSector('restaurant').map((i) => i.category);
    expect(categories.indexOf('pos')).toBeLessThan(categories.indexOf('accounting'));
  });

  it('falls back to the universal set for an unknown sector', () => {
    const ids = integrationsForSector('sector_from_the_future').map((i) => i.id);
    expect(ids).toEqual(['google_calendar', 'quickbooks']);
    expect(integrationsForSector(null).length).toBe(2);
  });
});

describe('lookup', () => {
  it('resolves a known id and degrades on an unknown one', () => {
    expect(findIntegration('square')?.name).toBe('Square');
    expect(findIntegration('nope')).toBeUndefined();
    expect(integrationName('nope')).toBe('Unknown app');
  });
});
