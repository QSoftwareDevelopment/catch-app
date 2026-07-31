/**
 * Conversations — the unified inbox.
 *
 * Missed calls and SMS threads are deliberately one list, not two. A missed call is the
 * moment Catch texts the customer back, so it *is* the start of a conversation; keeping
 * them apart would show the same customer twice and force the owner to reconcile which
 * "(289) 671-7110" is which.
 *
 * What a missed-call origin still earns is a marker on the row and a filter, because
 * "someone rang and I never picked up" is a different kind of urgency from an inbound
 * text.
 */

export type ConversationStatus = 'active' | 'closed';

/** How the thread began. Drives the row marker and the "Missed calls" filter. */
export type ConversationOrigin = 'missed_call' | 'inbound_text';

export type MessageAuthor =
  /** Automatic reply written by the assistant. */
  | 'catch'
  /** Typed by the business owner. */
  | 'owner'
  /** The customer. */
  | 'customer';

export type Message = {
  id: string;
  author: MessageAuthor;
  body: string;
  /** ISO timestamp. */
  at: string;
};

export type Conversation = {
  id: string;
  /** E.164, the storage form. Never rendered directly. */
  phone: string;
  origin: ConversationOrigin;
  status: ConversationStatus;
  /** True once the owner has chosen never to text this number again. */
  blocked: boolean;
  createdAt: string;
  updatedAt: string;
  messages: Message[];
};

export type ConversationFilter = 'all' | 'active' | 'closed' | 'missed';

export const FILTERS: readonly { id: ConversationFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'closed', label: 'Closed' },
  { id: 'missed', label: 'Missed calls' },
];
