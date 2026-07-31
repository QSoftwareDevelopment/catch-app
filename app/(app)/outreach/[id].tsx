import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/auth/AuthProvider';
import { useConversations } from '@/conversations/ConversationsProvider';
import { audienceLabel, audienceSize } from '@/outreach/audiences';
import { eventLabel } from '@/outreach/events';
import { useOutreach } from '@/outreach/OutreachProvider';
import { describeSchedule, fullMessage, messageCost, nextRun } from '@/outreach/sms';
import { TRIGGER_LABELS } from '@/outreach/types';
import { colors, fontSize, radius, spacing } from '@/theme/theme';
import { Button } from '@/ui/Button';
import { Screen } from '@/ui/Screen';

/** A single campaign: what it says, who it reaches, and whether it is live. */
export default function CampaignScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { business } = useAuth();
  const { conversations } = useConversations();
  const { getCampaign, setStatus, removeCampaign, markSent } = useOutreach();

  const campaign = getCampaign(String(id));

  if (!campaign) {
    return (
      <Screen scroll testID="campaign-missing">
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.back}>
          <Text style={styles.backText}>‹ Back</Text>
        </Pressable>
        <Text style={styles.title}>Outreach not found</Text>
      </Screen>
    );
  }

  const recipients = audienceSize(conversations, campaign.audienceId);
  const cost = messageCost(campaign.message, recipients);
  const automatic = campaign.triggerType !== 'manual';
  const live = campaign.status === 'active';

  return (
    <Screen scroll testID="campaign-screen">
      <Pressable onPress={() => router.back()} hitSlop={10} style={styles.back}>
        <Text style={styles.backText}>‹ Back</Text>
      </Pressable>

      <Text style={styles.title}>{campaign.name}</Text>
      <Text style={styles.subtitle}>{TRIGGER_LABELS[campaign.triggerType]} outreach</Text>

      {/* The message exactly as it will arrive, opt-out included — the only preview
          worth showing is the one the customer actually sees. */}
      <View style={styles.preview}>
        <Text style={styles.previewText}>{fullMessage(campaign.message)}</Text>
      </View>

      <View style={styles.card}>
        <Row
          label="When"
          value={
            campaign.triggerType === 'scheduled'
              ? describeSchedule(campaign.schedule)
              : campaign.triggerType === 'event'
                ? eventLabel(business?.sector, campaign.eventId)
                : 'Sent by hand'
          }
        />
        {campaign.triggerType === 'scheduled' && campaign.schedule ? (
          <Row
            label="Next run"
            value={nextRun(campaign.schedule).toLocaleDateString(undefined, {
              weekday: 'long',
              day: 'numeric',
              month: 'short',
            })}
          />
        ) : null}
        <Row label="List" value={audienceLabel(campaign.audienceId)} />
        <Row label="Reaches" value={`${recipients} ${recipients === 1 ? 'number' : 'numbers'}`} />
        <Row
          label="Cost per run"
          value={`${cost.totalSegments} ${cost.totalSegments === 1 ? 'text' : 'texts'}`}
          last
        />
      </View>

      {campaign.lastRunAt ? (
        <Text style={styles.lastRun}>
          Last sent {new Date(campaign.lastRunAt).toLocaleDateString()} to{' '}
          {campaign.lastRunCount ?? 0}.
        </Text>
      ) : null}

      <View style={styles.actions}>
        {automatic ? (
          <Button
            label={live ? 'Pause' : 'Turn on'}
            variant={live ? 'secondary' : 'primary'}
            onPress={() => setStatus(campaign.id, live ? 'paused' : 'active')}
            testID="campaign-toggle"
          />
        ) : (
          <Button
            label={`Send again to ${recipients}`}
            onPress={() => markSent(campaign.id, recipients)}
            disabled={recipients === 0}
            testID="campaign-send"
          />
        )}

        <Button
          label="Delete"
          variant="ghost"
          onPress={() => {
            removeCampaign(campaign.id);
            router.replace('/(app)/outreach');
          }}
          testID="campaign-delete"
        />
      </View>
    </Screen>
  );
}

function Row({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.row, last && styles.rowLast]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  back: { alignSelf: 'flex-start', paddingVertical: spacing.sm, marginBottom: spacing.md },
  backText: { fontSize: fontSize.md, fontWeight: '600', color: colors.textMuted },
  title: { fontSize: fontSize.xl, fontWeight: '800', letterSpacing: -0.4, color: colors.text },
  subtitle: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: spacing.xs, marginBottom: spacing.xl },

  preview: {
    backgroundColor: colors.ink,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  previewText: { fontSize: fontSize.sm, lineHeight: 21, color: colors.textInverse },

  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowLast: { borderBottomWidth: 0 },
  rowLabel: { fontSize: fontSize.sm, color: colors.textMuted },
  rowValue: { flexShrink: 1, fontSize: fontSize.sm, fontWeight: '600', color: colors.text, textAlign: 'right' },

  lastRun: { fontSize: fontSize.xs, color: colors.textMuted, marginBottom: spacing.lg },
  actions: { gap: spacing.sm },
});
