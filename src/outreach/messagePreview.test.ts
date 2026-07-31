import { campaignText } from './campaignText';
import { eventsForSector, findEvent } from './events';
import { buildPreview } from './messagePreview';
import { messageCost } from './sms';
import { TONES, type ToneId } from './tone';
import type { Campaign } from './types';

const LISTING = findEvent('real_estate', 'new_listing')!;
const SLOT = findEvent('real_estate', 'showing_slot')!;

function preview(tone: ToneId, guidance?: string) {
  return buildPreview({ event: LISTING, tone, businessName: 'Northside Realty', guidance });
}

describe('buildPreview', () => {
  it('writes a different message for every tone', () => {
    // If two tones produce identical text the picker is decoration.
    const outputs = TONES.map((t) => preview(t.id));
    expect(new Set(outputs).size).toBe(TONES.length);
  });

  it('always includes the event detail and the reply keyword', () => {
    for (const tone of TONES) {
      const text = preview(tone.id);
      expect(text).toContain(LISTING.sampleDetail);
      expect(text).toContain(LISTING.keyword);
    }
  });

  it('names the business in the tones that introduce themselves', () => {
    expect(preview('friendly')).toContain('Northside Realty');
    expect(preview('professional')).toContain('Northside Realty');
  });

  it('produces a readable sentence, not a fragment', () => {
    for (const tone of TONES) {
      const text = preview(tone.id);
      expect(text.length).toBeGreaterThan(40);
      expect(text).not.toContain('  ');
      expect(text).not.toMatch(/undefined|null|\[object/);
    }
  });

  it('stays inside GSM-7 for every non-playful tone, across every sector', () => {
    // An em dash, curly apostrophe, or ellipsis character forces UCS-2 and cuts a
    // segment from 160 characters to 70 — doubling the bill on text that looks
    // identical. This caught real em dashes in the generated copy.
    for (const sector of ['hvac', 'restaurant', 'real_estate', 'fitness', 'salon_spa']) {
      for (const event of eventsForSector(sector)) {
        for (const tone of TONES.filter((t) => !t.usesEmoji)) {
          const text = buildPreview({ event, tone: tone.id, businessName: 'Test Co' });
          expect({ sector, event: event.id, tone: tone.id, unicode: messageCost(text, 1).unicode })
            .toEqual({ sector, event: event.id, tone: tone.id, unicode: false });
        }
      }
    }
  });

  it('only the playful tone reaches for emoji', () => {
    // Emoji force unicode encoding, which halves SMS capacity — so this is a billing
    // decision as much as a stylistic one.
    expect(messageCost(preview('playful'), 1).unicode).toBe(true);
    expect(messageCost(preview('professional'), 1).unicode).toBe(false);
    expect(messageCost(preview('friendly'), 1).unicode).toBe(false);
  });

  it('includes owner guidance verbatim, before the call to action', () => {
    const text = preview('friendly', 'We close at 9');
    expect(text).toContain('We close at 9.');
    // The message must still end on the ask, or the guidance buries it.
    expect(text.indexOf('We close at 9')).toBeLessThan(text.indexOf(LISTING.keyword));
  });

  it('punctuates guidance without doubling up', () => {
    expect(preview('friendly', 'We close at 9.')).toContain('We close at 9.');
    expect(preview('friendly', 'We close at 9.')).not.toContain('We close at 9..');
  });

  it('ignores blank guidance', () => {
    expect(preview('friendly', '   ')).toBe(preview('friendly'));
  });

  it('reflects the event it was given', () => {
    const a = buildPreview({ event: LISTING, tone: 'friendly', businessName: 'X' });
    const b = buildPreview({ event: SLOT, tone: 'friendly', businessName: 'X' });
    expect(a).not.toBe(b);
    expect(b).toContain(SLOT.sampleDetail);
  });

  it('falls back to a known tone if given a bad one', () => {
    const text = buildPreview({
      event: LISTING,
      tone: 'nonsense' as ToneId,
      businessName: 'Northside Realty',
    });
    expect(text.length).toBeGreaterThan(20);
    expect(text).toContain(LISTING.keyword);
  });

  it('works for every event of every sector', () => {
    for (const sector of ['hvac', 'restaurant', 'real_estate', 'fitness', 'salon_spa', 'plumbing']) {
      for (const event of eventsForSector(sector)) {
        for (const tone of TONES) {
          const text = buildPreview({ event, tone: tone.id, businessName: 'Test Co' });
          expect(text.length).toBeGreaterThan(30);
          expect(text).not.toMatch(/undefined/);
        }
      }
    }
  });
});

describe('campaignText', () => {
  function campaign(overrides: Partial<Campaign>): Campaign {
    return {
      id: 'c',
      name: 'Test',
      triggerType: 'event',
      audienceId: 'everyone',
      messageMode: 'generated',
      status: 'active',
      createdAt: '',
      ...overrides,
    };
  }

  it('returns custom text untouched', () => {
    const c = campaign({ messageMode: 'custom', message: 'Exact words only.' });
    expect(campaignText(c, 'real_estate', 'X')).toBe('Exact words only.');
  });

  it('generates from the event and tone', () => {
    const c = campaign({ tone: 'urgent', eventId: 'new_listing' });
    const text = campaignText(c, 'real_estate', 'Northside Realty');
    expect(text).toContain(LISTING.sampleDetail);
  });

  it('falls back to guidance when there is no event to describe', () => {
    // A scheduled or manual generated campaign has nothing to describe, so guidance is
    // the whole message. Inventing a generic sentence would put words in front of
    // customers that the owner never approved.
    const c = campaign({ triggerType: 'scheduled', guidance: '50% off this hour' });
    expect(campaignText(c, 'real_estate', 'X')).toBe('50% off this hour');
  });

  it('returns empty rather than inventing copy for an unknown event', () => {
    const c = campaign({ eventId: 'event_from_the_future' });
    expect(campaignText(c, 'real_estate', 'X')).toBe('');
  });

  it('defaults a missing tone rather than throwing', () => {
    const c = campaign({ tone: undefined, eventId: 'new_listing' });
    expect(campaignText(c, 'real_estate', 'X').length).toBeGreaterThan(20);
  });
});
