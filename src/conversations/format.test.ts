import {
  areaCode,
  areaLabel,
  formatPhone,
  matchesFilter,
  matchesQuery,
  messageTime,
  previewText,
  relativeTime,
  selectConversations,
} from './format';
import type { Conversation } from './types';

function conv(overrides: Partial<Conversation> = {}): Conversation {
  return {
    id: 'c1',
    phone: '+12896717110',
    origin: 'inbound_text',
    status: 'active',
    blocked: false,
    createdAt: '2026-07-30T22:00:00.000Z',
    updatedAt: '2026-07-30T22:59:00.000Z',
    messages: [
      { id: 'm1', author: 'customer', body: 'How much for a tune-up?', at: '2026-07-30T22:00:00.000Z' },
      { id: 'm2', author: 'catch', body: 'It is $149.', at: '2026-07-30T22:59:00.000Z' },
    ],
    ...overrides,
  };
}

describe('formatPhone', () => {
  it('formats North American numbers with and without the country code', () => {
    expect(formatPhone('+12896717110')).toBe('(289) 671-7110');
    expect(formatPhone('2896717110')).toBe('(289) 671-7110');
  });

  it('returns anything it does not recognise untouched', () => {
    // A short code or an international caller must stay dialable rather than be
    // mangled into a plausible-looking wrong number.
    expect(formatPhone('+442079460000')).toBe('+442079460000');
    expect(formatPhone('12345')).toBe('12345');
    expect(formatPhone('')).toBe('');
  });
});

describe('areaCode and areaLabel', () => {
  it('reads the area code past the country code', () => {
    expect(areaCode('+13652285994')).toBe('365');
    expect(areaCode('+442079460000')).toBeNull();
  });

  it('names known regions and degrades honestly elsewhere', () => {
    expect(areaLabel('+14167076073')).toBe('Toronto, ON');
    expect(areaLabel('+12896717110')).toBe('Hamilton–Niagara, ON');
    // Guessing a region for an unmapped code would be worse than admitting ignorance.
    expect(areaLabel('+12125550100')).toBe('Area 212');
    expect(areaLabel('+442079460000')).toBe('Unknown area');
  });
});

describe('relativeTime', () => {
  const now = new Date('2026-07-31T12:00:00.000Z').getTime();

  it('scales the unit to the age', () => {
    expect(relativeTime('2026-07-31T11:59:40.000Z', now)).toBe('just now');
    expect(relativeTime('2026-07-31T11:30:00.000Z', now)).toBe('30m ago');
    expect(relativeTime('2026-07-30T23:00:00.000Z', now)).toBe('13h ago');
    expect(relativeTime('2026-07-29T12:00:00.000Z', now)).toBe('2d ago');
    expect(relativeTime('2026-07-17T12:00:00.000Z', now)).toBe('2w ago');
  });

  it('does not show a future time when the clock is skewed', () => {
    // Device and server clocks disagree by seconds routinely; "in 3 minutes" on a
    // message that just arrived reads as a bug.
    expect(relativeTime('2026-07-31T12:00:20.000Z', now)).toBe('just now');
  });

  it('returns empty for an unparseable timestamp', () => {
    expect(relativeTime('not-a-date', now)).toBe('');
    expect(messageTime('not-a-date')).toBe('');
  });
});

describe('previewText', () => {
  it('marks outbound messages so the owner knows who spoke last', () => {
    expect(previewText(conv())).toBe('You: It is $149.');
  });

  it('shows the customer message unprefixed', () => {
    const c = conv({
      messages: [{ id: 'm1', author: 'customer', body: 'Are you open?', at: '2026-07-30T22:00:00.000Z' }],
    });
    expect(previewText(c)).toBe('Are you open?');
  });

  it('collapses newlines so a multi-line SMS stays on one row', () => {
    const c = conv({
      messages: [{ id: 'm1', author: 'customer', body: 'Line one\n\nLine two', at: '2026-07-30T22:00:00.000Z' }],
    });
    expect(previewText(c)).toBe('Line one Line two');
  });

  it('describes an empty missed call rather than rendering blank', () => {
    expect(previewText(conv({ origin: 'missed_call', messages: [] }))).toBe('Missed call');
  });
});

describe('matchesFilter', () => {
  it('separates active, closed and missed-call threads', () => {
    expect(matchesFilter(conv({ status: 'active' }), 'active')).toBe(true);
    expect(matchesFilter(conv({ status: 'active' }), 'closed')).toBe(false);
    expect(matchesFilter(conv({ origin: 'missed_call' }), 'missed')).toBe(true);
    expect(matchesFilter(conv({ origin: 'inbound_text' }), 'missed')).toBe(false);
    expect(matchesFilter(conv({ status: 'closed' }), 'all')).toBe(true);
  });

  it('keeps a closed missed call in the missed filter', () => {
    // The two axes are independent: closing a thread must not hide it from the record
    // of who rang and never got called back.
    const c = conv({ origin: 'missed_call', status: 'closed' });
    expect(matchesFilter(c, 'missed')).toBe(true);
  });
});

describe('matchesQuery', () => {
  it('matches digits regardless of punctuation', () => {
    // Nobody types the brackets when searching for a number they can see on screen.
    expect(matchesQuery(conv(), '289671')).toBe(true);
    expect(matchesQuery(conv(), '(289) 671')).toBe(true);
    expect(matchesQuery(conv(), '7110')).toBe(true);
    expect(matchesQuery(conv(), '5550000')).toBe(false);
  });

  it('matches the area name and message text', () => {
    expect(matchesQuery(conv(), 'hamilton')).toBe(true);
    expect(matchesQuery(conv(), 'tune-up')).toBe(true);
  });

  it('treats an empty query as matching everything', () => {
    expect(matchesQuery(conv(), '   ')).toBe(true);
  });
});

describe('selectConversations', () => {
  const older = conv({ id: 'old', updatedAt: '2026-07-29T10:00:00.000Z' });
  const newer = conv({ id: 'new', updatedAt: '2026-07-31T10:00:00.000Z' });
  const closed = conv({ id: 'closed', status: 'closed', updatedAt: '2026-07-30T10:00:00.000Z' });

  it('orders newest first', () => {
    expect(selectConversations([older, newer, closed], 'all', '').map((c) => c.id)).toEqual([
      'new',
      'closed',
      'old',
    ]);
  });

  it('applies filter and search together', () => {
    expect(selectConversations([older, newer, closed], 'closed', '').map((c) => c.id)).toEqual([
      'closed',
    ]);
    expect(selectConversations([older, newer, closed], 'all', 'nothing-here')).toEqual([]);
  });

  it('does not mutate the input array', () => {
    // sort() is in place; sorting the provider's state directly would reorder it
    // underneath React and lose the newest-first guarantee on the next render.
    const input = [older, newer, closed];
    const snapshot = input.map((c) => c.id);
    selectConversations(input, 'all', '');
    expect(input.map((c) => c.id)).toEqual(snapshot);
  });
});
