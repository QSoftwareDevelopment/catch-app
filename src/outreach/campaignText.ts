import { findEvent } from './events';
import { buildPreview } from './messagePreview';
import { DEFAULT_TONE, isToneId } from './tone';
import type { Campaign } from './types';

/**
 * The one way to get a campaign's text.
 *
 * List, detail, and cost estimate all read from here, so a generated campaign can never
 * be shown one wording in the composer and a different one on its detail screen.
 */
export function campaignText(
  campaign: Campaign,
  sector: string | null | undefined,
  businessName: string,
): string {
  if (campaign.messageMode === 'custom') {
    return campaign.message ?? '';
  }

  const event = findEvent(sector, campaign.eventId);
  const tone = isToneId(campaign.tone) ? campaign.tone : DEFAULT_TONE;

  // A scheduled or manual campaign has no event to describe, so guidance carries the
  // whole message. Falling back to a generic sentence would put words the owner never
  // approved in front of their customers.
  if (!event) {
    return campaign.guidance?.trim() ?? '';
  }

  return buildPreview({ event, tone, businessName, guidance: campaign.guidance });
}

/** True when the campaign has nothing to say yet and must not be armed. */
export function isCampaignEmpty(
  campaign: Campaign,
  sector: string | null | undefined,
  businessName: string,
): boolean {
  return campaignText(campaign, sector, businessName).trim().length === 0;
}
