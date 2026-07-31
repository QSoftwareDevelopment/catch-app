import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/auth/AuthProvider';
import { useConversations } from '@/conversations/ConversationsProvider';
import { audienceLabel, audienceSize } from '@/outreach/audiences';
import { eventLabel } from '@/outreach/events';
import { useOutreach } from '@/outreach/OutreachProvider';
import { describeSchedule } from '@/outreach/sms';
import { toneLabel } from '@/outreach/tone';
import { TRIGGER_LABELS, type Campaign } from '@/outreach/types';
import { colors, fontSize, radius, spacing } from '@/theme/theme';
import { Button } from '@/ui/Button';
import { Screen } from '@/ui/Screen';

/**
 * Outreach — campaigns that go out to a list of customers.
 *
 * Grouped by how they fire rather than listed flat, because "what runs by itself" and
 * "what I have to press send on" are different mental categories for an owner checking
 * whether anything is about to go out under their name.
 */
export default function OutreachScreen() {
  const router = useRouter();
  const { business } = useAuth();
  const { conversations } = useConversations();
  const { campaigns, isDemoData } = useOutreach();

  const automatic = campaigns.filter((c) => c.triggerType !== 'manual');
  const manual = campaigns.filter((c) => c.triggerType === 'manual');
  const liveCount = automatic.filter((c) => c.status === 'active').length;

  return (
    <Screen scroll testID="outreach-screen">
      <Pressable
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        hitSlop={10}
        style={styles.back}
      >
        <Text style={styles.backText}>‹ Back</Text>
      </Pressable>

      <Text style={styles.title}>Outreach</Text>
      <Text style={styles.subtitle}>
        {campaigns.length === 0
          ? 'Reach past customers with a text'
          : `${liveCount} running automatically`}
      </Text>

      <Button
        label="New outreach"
        onPress={() => router.push('/(app)/outreach/new')}
        style={styles.newButton}
        testID="outreach-new"
      />

      {campaigns.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Text style={styles.emptyIconText}>📣</Text>
          </View>
          <Text style={styles.emptyTitle}>No outreach yet</Text>
          <Text style={styles.emptyBody}>
            Send a one-off message, set one to repeat weekly, or have one fire by itself
            when something happens in your business.
          </Text>
        </View>
      ) : (
        <>
          {automatic.length > 0 ? (
            <Section title="Runs by itself">
              {automatic.map((campaign) => (
                <Row
                  key={campaign.id}
                  campaign={campaign}
                  sector={business?.sector}
                  recipients={audienceSize(conversations, campaign.audienceId)}
                  onPress={() => router.push(`/(app)/outreach/${campaign.id}`)}
                />
              ))}
            </Section>
          ) : null}

          {manual.length > 0 ? (
            <Section title="One-off sends">
              {manual.map((campaign) => (
                <Row
                  key={campaign.id}
                  campaign={campaign}
                  sector={business?.sector}
                  recipients={audienceSize(conversations, campaign.audienceId)}
                  onPress={() => router.push(`/(app)/outreach/${campaign.id}`)}
                />
              ))}
            </Section>
          ) : null}
        </>
      )}

      {isDemoData && campaigns.length > 0 ? (
        <View style={styles.notice}>
          <Text style={styles.noticeText}>
            Sample campaigns. Nothing is scheduled and no messages are sent.
          </Text>
        </View>
      ) : null}
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function Row({
  campaign,
  sector,
  recipients,
  onPress,
}: {
  campaign: Campaign;
  sector: string | null | undefined;
  recipients: number;
  onPress: () => void;
}) {
  const when =
    campaign.triggerType === 'scheduled'
      ? describeSchedule(campaign.schedule)
      : campaign.triggerType === 'event'
        ? `When: ${eventLabel(sector, campaign.eventId)}`
        : campaign.lastRunAt
          ? `Sent to ${campaign.lastRunCount ?? 0}`
          : 'Not sent yet';

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${campaign.name}, ${campaign.status}`}
      testID={`campaign-${campaign.id}`}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      <View style={styles.rowBody}>
        <Text style={styles.rowName} numberOfLines={1}>
          {campaign.name}
        </Text>
        <Text style={styles.rowWhen} numberOfLines={1}>
          {when}
        </Text>
        <Text style={styles.rowAudience} numberOfLines={1}>
          {audienceLabel(campaign.audienceId)} · {recipients}{' '}
          {recipients === 1 ? 'number' : 'numbers'}
          {campaign.messageMode === 'generated'
            ? ` · AI · ${toneLabel(campaign.tone)}`
            : ''}
        </Text>
      </View>

      <View style={styles.rowRight}>
        <StatusPill status={campaign.status} />
        <Text style={styles.trigger}>{TRIGGER_LABELS[campaign.triggerType]}</Text>
      </View>
    </Pressable>
  );
}

export function StatusPill({ status }: { status: Campaign['status'] }) {
  const style =
    status === 'active'
      ? styles.pillActive
      : status === 'paused'
        ? styles.pillPaused
        : status === 'sent'
          ? styles.pillSent
          : styles.pillDraft;

  const textStyle =
    status === 'active'
      ? styles.pillTextActive
      : status === 'paused'
        ? styles.pillTextPaused
        : styles.pillTextMuted;

  const label =
    status === 'active' ? 'Live' : status === 'paused' ? 'Paused' : status === 'sent' ? 'Sent' : 'Draft';

  return (
    <View style={[styles.pill, style]}>
      <Text style={[styles.pillText, textStyle]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  back: { alignSelf: 'flex-start', paddingVertical: spacing.sm, marginBottom: spacing.md },
  backText: { fontSize: fontSize.md, fontWeight: '600', color: colors.textMuted },

  title: {
    fontSize: fontSize.display,
    lineHeight: 38,
    fontWeight: '800',
    letterSpacing: -0.8,
    color: colors.text,
  },
  subtitle: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: spacing.xs },
  newButton: { marginTop: spacing.lg, marginBottom: spacing.xl },

  section: { marginBottom: spacing.xl },
  sectionTitle: {
    fontSize: fontSize.xs,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  sectionBody: { gap: spacing.sm },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  rowPressed: { opacity: 0.85, borderColor: colors.borderStrong },
  rowBody: { flex: 1 },
  rowName: { fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  rowWhen: { marginTop: 3, fontSize: fontSize.sm, color: colors.textMuted },
  rowAudience: { marginTop: 3, fontSize: fontSize.xs, color: colors.textMuted },
  rowRight: { alignItems: 'flex-end', gap: 6 },
  trigger: { fontSize: 10, fontWeight: '700', color: colors.textMuted },

  pill: { borderRadius: radius.pill, paddingVertical: 4, paddingHorizontal: spacing.md },
  pillActive: { backgroundColor: '#E8F7EF' },
  pillPaused: { backgroundColor: '#FFF4E5' },
  pillSent: { backgroundColor: colors.surfaceAlt },
  pillDraft: { backgroundColor: colors.surfaceAlt },
  pillText: { fontSize: 11, fontWeight: '800' },
  pillTextActive: { color: colors.accentPressed },
  pillTextPaused: { color: '#B26A00' },
  pillTextMuted: { color: colors.textMuted },

  empty: { alignItems: 'center', paddingVertical: spacing.xxl },
  emptyIcon: {
    width: 60,
    height: 60,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  emptyIconText: { fontSize: 26 },
  emptyTitle: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  emptyBody: {
    fontSize: fontSize.sm,
    lineHeight: 20,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },

  notice: {
    marginTop: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.borderStrong,
    padding: spacing.md,
  },
  noticeText: { fontSize: fontSize.xs, lineHeight: 18, color: colors.textMuted, textAlign: 'center' },
});
