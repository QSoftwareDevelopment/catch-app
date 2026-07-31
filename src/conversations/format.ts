import type { Conversation, ConversationFilter } from './types';

/**
 * Display helpers for the inbox. Pure functions, so the fiddly cases — a number that is
 * not ten digits, a timestamp in the future, an empty thread — are testable directly.
 */

/**
 * "+12896717110" → "(289) 671-7110".
 *
 * Falls back to the raw string rather than mangling anything it does not recognise. A
 * short code or an international caller must still be dialable from what is shown.
 */
export function formatPhone(e164: string): string {
  const digits = e164.replace(/\D/g, '');

  const local = digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits;
  if (local.length !== 10) return e164;

  return `(${local.slice(0, 3)}) ${local.slice(3, 6)}-${local.slice(6)}`;
}

/** The three-digit area code, or null when the number is not North American. */
export function areaCode(e164: string): string | null {
  const digits = e164.replace(/\D/g, '');
  const local = digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits;
  return local.length === 10 ? local.slice(0, 3) : null;
}

/**
 * Where an area code is. Covers southern Ontario, where the first customers are, and
 * degrades to the bare code elsewhere rather than guessing wrong.
 */
const AREAS: Record<string, string> = {
  '416': 'Toronto, ON',
  '647': 'Toronto, ON',
  '437': 'Toronto, ON',
  '905': 'Hamilton–Niagara, ON',
  '289': 'Hamilton–Niagara, ON',
  '365': 'Hamilton–Niagara, ON',
  '519': 'Southwestern ON',
  '226': 'Southwestern ON',
  '548': 'Southwestern ON',
  '613': 'Ottawa, ON',
  '343': 'Ottawa, ON',
  '705': 'Northern ON',
  '249': 'Northern ON',
};

export function areaLabel(e164: string): string {
  const code = areaCode(e164);
  if (!code) return 'Unknown area';
  return AREAS[code] ?? `Area ${code}`;
}

/**
 * "13h ago". Coarse on purpose — an owner glancing at a list needs to know whether
 * something is minutes or days old, not the exact minute.
 */
export function relativeTime(iso: string, now: number = Date.now()): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';

  const seconds = Math.round((now - then) / 1000);

  // Clock skew between device and server can put a timestamp slightly ahead. Showing
  // "in 3 minutes" for a message that just arrived would look broken.
  if (seconds < 45) return 'just now';

  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;

  const weeks = Math.round(days / 7);
  if (weeks < 5) return `${weeks}w ago`;

  return new Date(iso).toLocaleDateString();
}

/** "10:59 p.m." — the timestamp under a message bubble. */
export function messageTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

export function lastMessage(conversation: Conversation) {
  return conversation.messages[conversation.messages.length - 1] ?? null;
}

/** One-line preview under the number in the list. */
export function previewText(conversation: Conversation): string {
  const message = lastMessage(conversation);
  if (!message) {
    return conversation.origin === 'missed_call' ? 'Missed call' : 'No messages yet';
  }
  const prefix = message.author === 'customer' ? '' : 'You: ';
  return `${prefix}${message.body.replace(/\s+/g, ' ').trim()}`;
}

export function matchesFilter(
  conversation: Conversation,
  filter: ConversationFilter,
): boolean {
  switch (filter) {
    case 'active':
      return conversation.status === 'active';
    case 'closed':
      return conversation.status === 'closed';
    case 'missed':
      return conversation.origin === 'missed_call';
    default:
      return true;
  }
}

/**
 * Search across the number and its area.
 *
 * Digits are compared with punctuation stripped, so "289671" matches
 * "(289) 671-7110" — nobody types the brackets.
 */
export function matchesQuery(conversation: Conversation, rawQuery: string): boolean {
  const query = rawQuery.trim().toLowerCase();
  if (!query) return true;

  const queryDigits = query.replace(/\D/g, '');
  if (queryDigits.length > 0) {
    if (conversation.phone.replace(/\D/g, '').includes(queryDigits)) return true;
  }

  if (areaLabel(conversation.phone).toLowerCase().includes(query)) return true;

  return conversation.messages.some((m) => m.body.toLowerCase().includes(query));
}

/** Filter, search, and order newest-first — the list exactly as rendered. */
export function selectConversations(
  conversations: Conversation[],
  filter: ConversationFilter,
  query: string,
): Conversation[] {
  return conversations
    .filter((c) => matchesFilter(c, filter) && matchesQuery(c, query))
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}
