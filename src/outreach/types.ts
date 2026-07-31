/**
 * Outreach — sending something to a list of customers.
 *
 * Every campaign is the same two decisions plus a trigger:
 *   1. WHO   — an audience, built from the people who have already texted the business
 *   2. WHAT  — the message
 *   3. WHEN  — manual, scheduled, or fired by a business event
 *
 * Keeping those orthogonal is what stops this becoming three separate features. A weekly
 * voucher and a "slot just opened" alert differ only in the trigger.
 */

export type TriggerType = 'manual' | 'scheduled' | 'event';

/** 0 = Sunday, matching Date.getDay(). */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type Schedule = {
  weekday: Weekday;
  /** 24-hour local time. */
  hour: number;
  minute: number;
};

export type CampaignStatus =
  /** Saved but not live. */
  | 'draft'
  /** Scheduled or event campaign that is armed. */
  | 'active'
  /** Armed but temporarily off. */
  | 'paused'
  /** A manual send that has gone out. */
  | 'sent';

/**
 * Who writes the message.
 *
 * `generated` is the default and the point of the product: the assistant writes each
 * message from the real event, in the owner's chosen tone. `custom` exists because an
 * owner sometimes needs exact words — a legal disclaimer, a price they must state
 * precisely — and taking that away would make the feature unusable for them.
 */
export type MessageMode = 'generated' | 'custom';

export type Campaign = {
  id: string;
  name: string;
  triggerType: TriggerType;
  audienceId: string;
  messageMode: MessageMode;
  /** Voice the assistant writes in. Present when messageMode is 'generated'. */
  tone?: string;
  /** Optional owner steer, e.g. "mention we close at 9". */
  guidance?: string;
  /** Exact text. Present only when messageMode is 'custom'. */
  message?: string;
  /** Present for scheduled campaigns. */
  schedule?: Schedule;
  /** Present for event campaigns — an id from the sector's event catalogue. */
  eventId?: string;
  status: CampaignStatus;
  createdAt: string;
  lastRunAt?: string;
  /** How many numbers the last run reached, once it has run. */
  lastRunCount?: number;
};

export const WEEKDAY_LABELS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

export const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

export const TRIGGER_LABELS: Record<TriggerType, string> = {
  manual: 'Manual',
  scheduled: 'Scheduled',
  event: 'Event',
};

export const TRIGGER_BLURBS: Record<TriggerType, string> = {
  manual: 'Write it now and send it once.',
  scheduled: 'Repeats on the day and time you pick.',
  event: 'Fires by itself when something happens in your business.',
};
