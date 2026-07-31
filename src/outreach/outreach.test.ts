import type { Conversation } from '@/conversations/types';

import { AUDIENCES, audiencePhones, audienceSize, selectAudience } from './audiences';
import { eventLabel, eventsForSector, findEvent } from './events';
import {
  OPT_OUT_FOOTER,
  describeSchedule,
  fullMessage,
  messageCost,
  nextRun,
  segmentCount,
  usesUnicode,
} from './sms';
import type { Weekday } from './types';

const NOW = new Date('2026-07-31T12:00:00.000Z').getTime();
const DAY = 24 * 60 * 60 * 1000;

function conv(overrides: Partial<Conversation> = {}): Conversation {
  return {
    id: 'c1',
    phone: '+12896717110',
    origin: 'inbound_text',
    status: 'active',
    blocked: false,
    createdAt: new Date(NOW - DAY).toISOString(),
    updatedAt: new Date(NOW - DAY).toISOString(),
    messages: [],
    ...overrides,
  };
}

describe('audiences — blocked numbers', () => {
  it('excludes blocked numbers from every audience without exception', () => {
    // "Never text this number" has to mean never. If any audience can reintroduce a
    // blocked number the setting is a lie and the business carries the complaint.
    const blocked = conv({ id: 'b', phone: '+15550000000', blocked: true, origin: 'missed_call' });
    const ok = conv({ id: 'a' });

    for (const audience of AUDIENCES) {
      const phones = audiencePhones([blocked, ok], audience.id, NOW);
      expect(phones).not.toContain('+15550000000');
    }
  });
});

describe('audiences — selection', () => {
  const recent = conv({ id: 'recent', phone: '+15551110000', updatedAt: new Date(NOW - 2 * DAY).toISOString() });
  const lapsed = conv({ id: 'lapsed', phone: '+15552220000', updatedAt: new Date(NOW - 90 * DAY).toISOString() });
  const missed = conv({ id: 'missed', phone: '+15553330000', origin: 'missed_call' });
  const closed = conv({ id: 'closed', phone: '+15554440000', status: 'closed' });
  const all = [recent, lapsed, missed, closed];

  it('picks recent contacts inside 30 days', () => {
    expect(selectAudience(all, 'recent', NOW).map((c) => c.id)).toEqual(['recent', 'missed', 'closed']);
  });

  it('picks lapsed contacts past 60 days', () => {
    expect(selectAudience(all, 'lapsed', NOW).map((c) => c.id)).toEqual(['lapsed']);
  });

  it('recent and lapsed never overlap', () => {
    // A gap between the windows is fine; an overlap would double-send to one person.
    const recentIds = new Set(selectAudience(all, 'recent', NOW).map((c) => c.id));
    for (const c of selectAudience(all, 'lapsed', NOW)) {
      expect(recentIds.has(c.id)).toBe(false);
    }
  });

  it('picks missed callers and open threads', () => {
    expect(selectAudience(all, 'missed_calls', NOW).map((c) => c.id)).toEqual(['missed']);
    expect(selectAudience(all, 'open_threads', NOW).map((c) => c.id)).not.toContain('closed');
  });

  it('returns nothing for an audience it does not know', () => {
    expect(selectAudience(all, 'not_a_real_list', NOW)).toEqual([]);
  });
});

describe('audienceSize', () => {
  it('counts distinct numbers, not conversations', () => {
    // One customer with three threads is one person and one message, not three. Getting
    // this wrong overstates reach and undercounts nothing — it overcharges.
    const a = conv({ id: '1', phone: '+12896717110' });
    const b = conv({ id: '2', phone: '+12896717110' });
    const c = conv({ id: '3', phone: '+14165550000' });
    expect(audienceSize([a, b, c], 'everyone', NOW)).toBe(2);
  });
});

describe('sms segments', () => {
  it('counts a short message as one text', () => {
    expect(segmentCount('Order now')).toBe(1);
    expect(segmentCount('a'.repeat(160))).toBe(1);
  });

  it('splits past 160 characters at 153 per part', () => {
    expect(segmentCount('a'.repeat(161))).toBe(2);
    expect(segmentCount('a'.repeat(306))).toBe(2);
    expect(segmentCount('a'.repeat(307))).toBe(3);
  });

  it('halves capacity when the text forces unicode', () => {
    // One emoji in an otherwise short message can double the bill. This is the single
    // most common surprise on an SMS invoice.
    expect(usesUnicode('Order now')).toBe(false);
    expect(usesUnicode('Order now 🎉')).toBe(true);
    expect(segmentCount('a'.repeat(80))).toBe(1);
    expect(segmentCount('🎉' + 'a'.repeat(79))).toBe(2);
  });

  it('counts nothing for an empty message', () => {
    expect(segmentCount('')).toBe(0);
  });
});

describe('opt-out footer', () => {
  it('appends an opt-out to every message', () => {
    expect(fullMessage('50% off today')).toBe(`50% off today${OPT_OUT_FOOTER}`);
  });

  it('does not double up when the owner wrote their own', () => {
    const own = 'Half price today. Reply STOP to unsubscribe.';
    expect(fullMessage(own)).toBe(own);
  });

  it('stays empty for an empty message', () => {
    expect(fullMessage('   ')).toBe('');
  });

  it('counts the footer in the billed total', () => {
    // The footer is part of what is sent, so a message that fits in one text without it
    // must not be quoted as one text.
    const body = 'a'.repeat(150);
    expect(segmentCount(body)).toBe(1);
    expect(messageCost(body, 1).segments).toBe(2);
  });
});

describe('messageCost', () => {
  it('multiplies segments by recipients', () => {
    const cost = messageCost('Short offer', 40);
    expect(cost.segments).toBe(1);
    expect(cost.totalSegments).toBe(40);
  });

  it('is zero-cost with no recipients', () => {
    expect(messageCost('Short offer', 0).totalSegments).toBe(0);
  });
});

describe('schedules', () => {
  it('describes a weekly slot in plain language', () => {
    expect(describeSchedule({ weekday: 5, hour: 17, minute: 0 })).toBe('Every Friday at 5:00 PM');
    expect(describeSchedule({ weekday: 0, hour: 0, minute: 30 })).toBe('Every Sunday at 12:30 AM');
    expect(describeSchedule(undefined)).toBe('No schedule set');
  });

  it('finds the next matching day', () => {
    // Wednesday 2026-07-29 at 10:00 local.
    const wed = new Date(2026, 6, 29, 10, 0, 0);
    const next = nextRun({ weekday: 5, hour: 17, minute: 0 }, wed);
    expect(next.getDay()).toBe(5);
    expect(next.getHours()).toBe(17);
    expect(next.getDate()).toBe(31);
  });

  it('rolls to next week when today’s time has already passed', () => {
    // Friday 18:00 asking for Friday 17:00 must not schedule a run in the past.
    const fri = new Date(2026, 6, 31, 18, 0, 0);
    const next = nextRun({ weekday: 5, hour: 17, minute: 0 }, fri);
    expect(next.getTime()).toBeGreaterThan(fri.getTime());
    expect(next.getDate()).toBe(7);
  });

  it('keeps a later slot today', () => {
    const fri = new Date(2026, 6, 31, 9, 0, 0);
    const next = nextRun({ weekday: 5, hour: 17, minute: 0 }, fri);
    expect(next.getDate()).toBe(31);
  });
});

describe('events per sector', () => {
  it('gives each trade events it would recognise', () => {
    expect(eventsForSector('real_estate').map((e) => e.id)).toContain('new_listing');
    expect(eventsForSector('real_estate').map((e) => e.id)).toContain('showing_slot');
    expect(eventsForSector('restaurant').map((e) => e.id)).toContain('new_menu_item');
    expect(eventsForSector('fitness').map((e) => e.id)).toContain('class_spot');
    expect(eventsForSector('salon_spa').map((e) => e.id)).toContain('chair_opened');
  });

  it('never offers a plumber a menu event', () => {
    // The tell that software was built for somebody else.
    expect(eventsForSector('plumbing').map((e) => e.id)).not.toContain('new_menu_item');
    expect(eventsForSector('hvac').map((e) => e.id)).not.toContain('new_listing');
  });

  it('gives every event a suggested message so the box is never empty', () => {
    for (const sector of ['hvac', 'restaurant', 'real_estate', 'fitness', 'salon_spa']) {
      for (const event of eventsForSector(sector)) {
        expect(event.suggestedMessage.trim().length).toBeGreaterThan(10);
      }
    }
  });

  it('falls back rather than rendering a raw id', () => {
    expect(eventsForSector('sector_from_the_future').length).toBeGreaterThan(0);
    expect(eventLabel('restaurant', 'no_such_event')).toBe('A business event');
    expect(eventLabel('restaurant', undefined)).toBe('A business event');
    expect(findEvent('restaurant', 'new_menu_item')?.label).toBe('New menu item');
  });
});

describe('weekday typing', () => {
  it('accepts every day of the week', () => {
    for (let d = 0; d < 7; d += 1) {
      expect(describeSchedule({ weekday: d as Weekday, hour: 9, minute: 0 })).toMatch(/^Every /);
    }
  });
});
