import type { OutreachEvent } from './events';
import type { ToneId } from './tone';

/**
 * Preview of what the assistant will write.
 *
 * ── Why this is a preview and not the message ──────────────────────────────────
 * For an event campaign the real message cannot exist until the event fires, because it
 * depends on which listing, which slot, which item. So the owner is shown a worked
 * example built from the same inputs the assistant will use — event, tone, and their own
 * guidance — with sample details standing in for the real ones.
 *
 * Presenting this as the final message would be a lie the owner would only discover
 * after it had gone to their customers.
 *
 * ── The seam ───────────────────────────────────────────────────────────────────
 * `buildPreview` is deliberately the only place wording is produced. It is pure and
 * synchronous today so the composer stays instant and works offline. When the generation
 * service exists, this is the single function that calls it; every screen already reads
 * from here, and the `PreviewInput` shape is what would be sent.
 */

export type PreviewInput = {
  event: OutreachEvent;
  tone: ToneId;
  businessName: string;
  /** Optional owner steer: "mention we close at 9". */
  guidance?: string;
};

type Frame = {
  /** Leading flourish, if the tone has one. */
  lead: (businessName: string) => string;
  body: (subject: string, detail: string) => string;
  cta: (offer: string, keyword: string) => string;
};

/**
 * Every frame stays inside GSM-7 except the playful one, which spends its emoji
 * deliberately.
 *
 * An em dash, a curly apostrophe, or an ellipsis character forces UCS-2 encoding, which
 * cuts an SMS segment from 160 characters to 70 — doubling the bill on a message that
 * looks identical to the owner. Plain hyphens and straight quotes only.
 */
const FRAMES: Record<ToneId, Frame> = {
  friendly: {
    lead: (name) => `Hi, it's ${name}.`,
    body: (subject, detail) => `Just letting you know ${subject} - ${detail}.`,
    cta: (offer, keyword) => `Want ${offer}? Reply ${keyword} and I'll sort it.`,
  },
  professional: {
    lead: (name) => `${name} here.`,
    body: (subject, detail) => `${capitalise(subject)}: ${detail}.`,
    cta: (offer, keyword) => `Reply ${keyword} for ${offer}.`,
  },
  urgent: {
    lead: () => '',
    body: (subject, detail) => `${capitalise(subject)} - ${detail}.`,
    cta: (offer, keyword) => `These go quickly. Reply ${keyword} now to claim ${offer}.`,
  },
  playful: {
    lead: () => '👀',
    body: (subject, detail) => `Guess what - ${subject}! ${capitalise(detail)}.`,
    cta: (offer, keyword) => `Fancy ${offer}? Hit reply with ${keyword} 🎉`,
  },
};

function capitalise(text: string): string {
  return text.length === 0 ? text : text[0].toUpperCase() + text.slice(1);
}

/**
 * Owner guidance is appended as its own sentence rather than being woven in, because
 * this generator cannot actually understand it. The real model will; until then, showing
 * it verbatim is honest about what will happen to it.
 */
function applyGuidance(lines: string[], guidance: string | undefined): string[] {
  const trimmed = guidance?.trim();
  if (!trimmed) return lines;

  const withStop = /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
  // Insert before the call to action so the message still ends on the ask.
  return [...lines.slice(0, -1), capitalise(withStop), lines[lines.length - 1]];
}

export function buildPreview(input: PreviewInput): string {
  const frame = FRAMES[input.tone] ?? FRAMES.friendly;
  const { event } = input;

  const lines = [
    frame.lead(input.businessName),
    frame.body(event.subject, event.sampleDetail),
    frame.cta(event.offer, event.keyword),
  ].filter((line) => line.trim().length > 0);

  return applyGuidance(lines, input.guidance).join(' ');
}

/**
 * The parts of the preview that are stand-ins. Surfaced so the UI can say plainly which
 * bits get replaced with real data at send time.
 */
export function previewPlaceholders(event: OutreachEvent): string[] {
  return [event.sampleDetail];
}
