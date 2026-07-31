import type { Conversation } from '@/conversations/types';

/**
 * Audiences — the "list of numbers" a campaign goes to.
 *
 * Every audience is derived from people who have already texted the business. Catch has
 * no list to sell and no numbers to import; the only numbers it knows are ones that
 * chose to make contact. That is also what makes sending to them defensible.
 *
 * Blocked numbers are excluded from every audience, without exception. "Never text this
 * number" has to mean never, or the setting is a lie and the business is exposed.
 */

export type AudienceId =
  | 'everyone'
  | 'recent'
  | 'lapsed'
  | 'missed_calls'
  | 'open_threads';

export type Audience = {
  id: AudienceId;
  label: string;
  description: string;
};

export const AUDIENCES: readonly Audience[] = [
  {
    id: 'everyone',
    label: 'Everyone who has texted',
    description: 'Every customer who has ever messaged you',
  },
  {
    id: 'recent',
    label: 'Recent customers',
    description: 'Anyone in touch in the last 30 days',
  },
  {
    id: 'lapsed',
    label: 'Lapsed customers',
    description: 'No contact for 60 days or more',
  },
  {
    id: 'missed_calls',
    label: 'Missed callers',
    description: 'People whose call you never picked up',
  },
  {
    id: 'open_threads',
    label: 'Open conversations',
    description: 'Threads still marked active',
  },
];

const DAY = 24 * 60 * 60 * 1000;

export function getAudience(id: string): Audience | undefined {
  return AUDIENCES.find((a) => a.id === id);
}

export function audienceLabel(id: string): string {
  return getAudience(id)?.label ?? 'Unknown list';
}

/**
 * The conversations an audience covers.
 *
 * `now` is injectable so the recency windows can be tested without freezing the clock.
 */
export function selectAudience(
  conversations: Conversation[],
  id: string,
  now: number = Date.now(),
): Conversation[] {
  // Non-negotiable, and applied before anything else so no branch below can reintroduce
  // a blocked number.
  const reachable = conversations.filter((c) => !c.blocked);

  switch (id) {
    case 'recent':
      return reachable.filter((c) => now - new Date(c.updatedAt).getTime() <= 30 * DAY);
    case 'lapsed':
      return reachable.filter((c) => now - new Date(c.updatedAt).getTime() >= 60 * DAY);
    case 'missed_calls':
      return reachable.filter((c) => c.origin === 'missed_call');
    case 'open_threads':
      return reachable.filter((c) => c.status === 'active');
    case 'everyone':
      return reachable;
    default:
      return [];
  }
}

/**
 * How many people a campaign would reach.
 *
 * Counts distinct numbers, not conversations — the same customer can have several
 * threads, and telling an owner they are reaching 40 people when it is 30 numbers and
 * ten repeats would overstate the send and undercount the cost.
 */
export function audienceSize(
  conversations: Conversation[],
  id: string,
  now: number = Date.now(),
): number {
  return new Set(selectAudience(conversations, id, now).map((c) => c.phone)).size;
}

/** Distinct destination numbers, ready to send to. */
export function audiencePhones(
  conversations: Conversation[],
  id: string,
  now: number = Date.now(),
): string[] {
  return [...new Set(selectAudience(conversations, id, now).map((c) => c.phone))];
}
