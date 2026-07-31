import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/auth/AuthProvider';
import { useConversations } from '@/conversations/ConversationsProvider';
import { AUDIENCES, audienceSize } from '@/outreach/audiences';
import { eventsForSector } from '@/outreach/events';
import { MessageSection } from '@/outreach/MessageSection';
import { buildPreview } from '@/outreach/messagePreview';
import { useOutreach } from '@/outreach/OutreachProvider';
import { describeSchedule, messageCost, nextRun, OPT_OUT_FOOTER } from '@/outreach/sms';
import { DEFAULT_TONE, type ToneId } from '@/outreach/tone';
import {
  TRIGGER_BLURBS,
  TRIGGER_LABELS,
  WEEKDAY_SHORT,
  type MessageMode,
  type TriggerType,
  type Weekday,
} from '@/outreach/types';
import { colors, fontSize, radius, spacing } from '@/theme/theme';
import { Button } from '@/ui/Button';
import { FormBanner } from '@/ui/FormBanner';
import { Screen } from '@/ui/Screen';

const TRIGGERS: TriggerType[] = ['manual', 'scheduled', 'event'];
const HOURS = [7, 9, 11, 12, 14, 16, 17, 18, 19, 20];

export default function NewOutreachScreen() {
  const router = useRouter();
  const { business } = useAuth();
  const { conversations } = useConversations();
  const { addCampaign, markSent } = useOutreach();

  const events = useMemo(() => eventsForSector(business?.sector), [business?.sector]);
  const businessName = business?.name ?? 'Catch';

  const [trigger, setTrigger] = useState<TriggerType>('manual');
  const [audienceId, setAudienceId] = useState<string>('everyone');
  const [eventId, setEventId] = useState<string>(events[0]?.id ?? '');
  const [weekday, setWeekday] = useState<Weekday>(5);
  const [hour, setHour] = useState(17);
  const [mode, setMode] = useState<MessageMode>('custom');
  const [tone, setTone] = useState<ToneId>(DEFAULT_TONE);
  const [guidance, setGuidance] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  const selectedEvent = events.find((e) => e.id === eventId);
  const recipients = audienceSize(conversations, audienceId);
  const schedule = { weekday, hour, minute: 0 };

  // Preview doubles as the cost basis. An owner picking a chatty tone should see the
  // extra segments before arming the campaign, not on the invoice.
  const preview = useMemo(() => {
    if (mode === 'custom') return customMessage;
    if (selectedEvent) {
      return buildPreview({ event: selectedEvent, tone, businessName, guidance });
    }
    return guidance.trim();
  }, [mode, customMessage, selectedEvent, tone, businessName, guidance]);

  const cost = messageCost(preview, recipients);

  function chooseTrigger(next: TriggerType) {
    setTrigger(next);
    // An event campaign is the case generation exists for, so default to it there.
    // Manual sends are usually a specific announcement, so they default to exact words.
    if (next === 'event') setMode('generated');
    if (next === 'manual' && mode === 'generated' && !guidance.trim()) setMode('custom');
  }

  function handleSubmit() {
    if (mode === 'generated' && !selectedEvent && guidance.trim().length < 5) {
      setError('Tell Catch what to say, or switch to writing it yourself.');
      return;
    }
    if (mode === 'custom' && customMessage.trim().length < 5) {
      setError('Write the message you want to send.');
      return;
    }
    if (recipients === 0) {
      setError('That list has nobody in it right now. Pick another.');
      return;
    }
    if (trigger === 'event' && !eventId) {
      setError('Choose what should set this off.');
      return;
    }
    setError(null);

    const name =
      trigger === 'event'
        ? (selectedEvent?.label ?? 'Event outreach')
        : (mode === 'custom' ? customMessage : guidance).trim().split('\n')[0].slice(0, 40) ||
          'Outreach';

    const campaign = addCampaign({
      name,
      triggerType: trigger,
      audienceId,
      messageMode: mode,
      tone: mode === 'generated' ? tone : undefined,
      guidance: mode === 'generated' ? guidance.trim() || undefined : undefined,
      message: mode === 'custom' ? customMessage.trim() : undefined,
      schedule: trigger === 'scheduled' ? schedule : undefined,
      eventId: trigger === 'event' ? eventId : undefined,
      status: trigger === 'manual' ? 'draft' : 'active',
    });

    if (trigger === 'manual') markSent(campaign.id, recipients);

    router.replace('/(app)/outreach');
  }

  return (
    <Screen scroll testID="outreach-new-screen">
      <Pressable onPress={() => router.back()} hitSlop={10} style={styles.back}>
        <Text style={styles.backText}>‹ Back</Text>
      </Pressable>

      <Text style={styles.title}>New outreach</Text>

      <FormBanner message={error} />

      {/* --- 1. When ------------------------------------------------------- */}
      <Text style={styles.step}>1 · When should it go out?</Text>
      <View style={styles.triggerRow}>
        {TRIGGERS.map((t) => {
          const selected = t === trigger;
          return (
            <Pressable
              key={t}
              onPress={() => chooseTrigger(t)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              testID={`trigger-${t}`}
              style={[styles.triggerCard, selected && styles.triggerCardSelected]}
            >
              <Text style={[styles.triggerLabel, selected && styles.triggerLabelSelected]}>
                {TRIGGER_LABELS[t]}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={styles.blurb}>{TRIGGER_BLURBS[trigger]}</Text>

      {trigger === 'scheduled' ? (
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Day</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {WEEKDAY_SHORT.map((label, index) => {
              const selected = index === weekday;
              return (
                <Pressable
                  key={label}
                  onPress={() => setWeekday(index as Weekday)}
                  accessibilityState={{ selected }}
                  testID={`weekday-${index}`}
                  style={[styles.chip, selected && styles.chipSelected]}
                >
                  <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <Text style={[styles.cardLabel, styles.cardLabelSpaced]}>Time</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {HOURS.map((h) => {
              const selected = h === hour;
              const label = `${h % 12 === 0 ? 12 : h % 12}${h < 12 ? 'am' : 'pm'}`;
              return (
                <Pressable
                  key={h}
                  onPress={() => setHour(h)}
                  accessibilityState={{ selected }}
                  testID={`hour-${h}`}
                  style={[styles.chip, selected && styles.chipSelected]}
                >
                  <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <Text style={styles.scheduleSummary}>
            {describeSchedule(schedule)} — next on{' '}
            {nextRun(schedule).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'short' })}
          </Text>
        </View>
      ) : null}

      {trigger === 'event' ? (
        <View style={styles.eventList}>
          {events.map((event) => {
            const selected = event.id === eventId;
            return (
              <Pressable
                key={event.id}
                onPress={() => setEventId(event.id)}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                testID={`event-${event.id}`}
                style={[styles.eventCard, selected && styles.eventCardSelected]}
              >
                <Text style={styles.eventIcon}>{event.icon}</Text>
                <View style={styles.eventBody}>
                  <Text style={styles.eventLabel}>{event.label}</Text>
                  <Text style={styles.eventDesc}>{event.description}</Text>
                </View>
                {selected ? <Text style={styles.check}>✓</Text> : null}
              </Pressable>
            );
          })}
        </View>
      ) : null}

      {/* --- 2. Who -------------------------------------------------------- */}
      <Text style={styles.step}>2 · Who gets it?</Text>
      <View style={styles.audienceList}>
        {AUDIENCES.map((audience) => {
          const selected = audience.id === audienceId;
          const size = audienceSize(conversations, audience.id);
          return (
            <Pressable
              key={audience.id}
              onPress={() => setAudienceId(audience.id)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              testID={`audience-${audience.id}`}
              style={[styles.audienceCard, selected && styles.audienceCardSelected]}
            >
              <View style={styles.audienceBody}>
                <Text style={styles.audienceLabel}>{audience.label}</Text>
                <Text style={styles.audienceDesc}>{audience.description}</Text>
              </View>
              <Text style={[styles.count, size === 0 && styles.countZero]}>{size}</Text>
            </Pressable>
          );
        })}
      </View>

      {/* --- 3. What ------------------------------------------------------- */}
      <Text style={styles.step}>3 · What does it say?</Text>
      <MessageSection
        mode={mode}
        onModeChange={setMode}
        tone={tone}
        onToneChange={setTone}
        guidance={guidance}
        onGuidanceChange={(next) => {
          setGuidance(next);
          if (error) setError(null);
        }}
        customMessage={customMessage}
        onCustomMessageChange={(next) => {
          setCustomMessage(next);
          if (error) setError(null);
        }}
        preview={preview}
        event={trigger === 'event' ? selectedEvent : undefined}
        guidancePlaceholder={
          trigger === 'event'
            ? 'e.g. mention we close at 9'
            : 'e.g. 50% off for the next hour'
        }
      />

      <View style={styles.costRow}>
        <Text style={styles.costText}>
          {cost.characters} chars · {cost.segments} {cost.segments === 1 ? 'text' : 'texts'} each
          {cost.unicode ? ' · emoji shortens each text' : ''}
        </Text>
        <Text style={styles.costTotal}>{cost.totalSegments} total</Text>
      </View>

      <Text style={styles.optOut}>
        “{OPT_OUT_FOOTER.trim()}” is added automatically so people can always opt out.
      </Text>

      <Button
        label={
          trigger === 'manual'
            ? `Send to ${recipients} ${recipients === 1 ? 'number' : 'numbers'}`
            : 'Turn it on'
        }
        onPress={handleSubmit}
        style={styles.submit}
        testID="outreach-submit"
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: { alignSelf: 'flex-start', paddingVertical: spacing.sm, marginBottom: spacing.md },
  backText: { fontSize: fontSize.md, fontWeight: '600', color: colors.textMuted },
  title: {
    fontSize: fontSize.xl,
    fontWeight: '800',
    letterSpacing: -0.4,
    color: colors.text,
    marginBottom: spacing.xl,
  },

  step: {
    fontSize: fontSize.xs,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.textMuted,
    marginBottom: spacing.md,
    marginTop: spacing.xl,
  },

  triggerRow: { flexDirection: 'row', gap: spacing.sm },
  triggerCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  triggerCardSelected: { backgroundColor: colors.ink, borderColor: colors.ink },
  triggerLabel: { fontSize: fontSize.sm, fontWeight: '700', color: colors.textMuted },
  triggerLabelSelected: { color: colors.textInverse },
  blurb: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: spacing.sm },

  card: {
    marginTop: spacing.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  cardLabel: { fontSize: fontSize.xs, fontWeight: '700', color: colors.textMuted, marginBottom: spacing.sm },
  cardLabelSpaced: { marginTop: spacing.lg },
  chips: { gap: spacing.sm, paddingRight: spacing.sm },
  chip: {
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 7,
    paddingHorizontal: spacing.md,
    minWidth: 46,
    alignItems: 'center',
  },
  chipSelected: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { fontSize: fontSize.xs, fontWeight: '700', color: colors.textMuted },
  chipTextSelected: { color: colors.accentInk },
  scheduleSummary: { marginTop: spacing.lg, fontSize: fontSize.sm, fontWeight: '600', color: colors.text },

  eventList: { gap: spacing.sm, marginTop: spacing.lg },
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.lg,
  },
  eventCardSelected: { borderColor: colors.accent, borderWidth: 2, backgroundColor: '#F2FDF8' },
  eventIcon: { fontSize: 20 },
  eventBody: { flex: 1 },
  eventLabel: { fontSize: fontSize.sm, fontWeight: '700', color: colors.text },
  eventDesc: { marginTop: 2, fontSize: fontSize.xs, color: colors.textMuted },
  check: { fontSize: fontSize.md, fontWeight: '800', color: colors.accentPressed },

  audienceList: { gap: spacing.sm },
  audienceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.lg,
  },
  audienceCardSelected: { borderColor: colors.accent, borderWidth: 2, backgroundColor: '#F2FDF8' },
  audienceBody: { flex: 1 },
  audienceLabel: { fontSize: fontSize.sm, fontWeight: '700', color: colors.text },
  audienceDesc: { marginTop: 2, fontSize: fontSize.xs, color: colors.textMuted },
  count: { fontSize: fontSize.lg, fontWeight: '800', color: colors.text },
  countZero: { color: colors.borderStrong },

  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    gap: spacing.md,
  },
  costText: { flex: 1, fontSize: fontSize.xs, color: colors.textMuted },
  costTotal: { fontSize: fontSize.xs, fontWeight: '800', color: colors.text },
  optOut: { marginTop: spacing.sm, fontSize: fontSize.xs, lineHeight: 17, color: colors.textMuted },

  submit: { marginTop: spacing.xl },
});
