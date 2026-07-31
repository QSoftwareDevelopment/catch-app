/**
 * Tone — how the assistant should sound when it writes a message.
 *
 * The owner picks a voice, not a script. The actual wording is generated when the
 * campaign runs, from the real event details.
 */

export const TONE_IDS = ['friendly', 'professional', 'urgent', 'playful'] as const;

export type ToneId = (typeof TONE_IDS)[number];

export type Tone = {
  id: ToneId;
  label: string;
  description: string;
  icon: string;
  /**
   * True when this tone habitually uses emoji. Emoji force UCS-2 encoding, which more
   * than halves how much fits in one SMS segment — so this changes the bill, and the
   * composer warns about it.
   */
  usesEmoji: boolean;
};

export const TONES: readonly Tone[] = [
  {
    id: 'friendly',
    label: 'Friendly',
    description: 'Warm and casual, like a text from a person',
    icon: '🙂',
    usesEmoji: false,
  },
  {
    id: 'professional',
    label: 'Professional',
    description: 'Short and businesslike, no filler',
    icon: '💼',
    usesEmoji: false,
  },
  {
    id: 'urgent',
    label: 'Urgent',
    description: 'Creates time pressure — best used sparingly',
    icon: '⚡',
    usesEmoji: false,
  },
  {
    id: 'playful',
    label: 'Playful',
    description: 'Light and fun, uses emoji',
    icon: '🎉',
    usesEmoji: true,
  },
];

export const DEFAULT_TONE: ToneId = 'friendly';

export function isToneId(value: unknown): value is ToneId {
  return typeof value === 'string' && (TONE_IDS as readonly string[]).includes(value);
}

export function getTone(id: string | null | undefined): Tone | undefined {
  return TONES.find((t) => t.id === id);
}

export function toneLabel(id: string | null | undefined): string {
  return getTone(id)?.label ?? 'Friendly';
}
