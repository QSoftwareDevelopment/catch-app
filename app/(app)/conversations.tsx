import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { useConversations } from '@/conversations/ConversationsProvider';
import {
  areaLabel,
  formatPhone,
  previewText,
  relativeTime,
  selectConversations,
} from '@/conversations/format';
import { FILTERS, type Conversation, type ConversationFilter } from '@/conversations/types';
import { colors, fontSize, radius, spacing } from '@/theme/theme';
import { Screen } from '@/ui/Screen';

/**
 * The inbox. Missed calls and SMS threads in one list.
 *
 * They are combined because a missed call is the moment Catch texts back — it is the
 * start of a thread, not a separate record. Splitting them would list the same customer
 * twice and leave the owner working out which is which.
 */
export default function ConversationsScreen() {
  const router = useRouter();
  const { conversations, isDemoData } = useConversations();

  const [filter, setFilter] = useState<ConversationFilter>('all');
  const [query, setQuery] = useState('');

  const visible = useMemo(
    () => selectConversations(conversations, filter, query),
    [conversations, filter, query],
  );

  const activeCount = conversations.filter((c) => c.status === 'active').length;

  return (
    <Screen scroll testID="conversations-screen">
      <Pressable
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        hitSlop={10}
        style={styles.back}
      >
        <Text style={styles.backText}>‹ Back</Text>
      </Pressable>

      <Text style={styles.title}>Conversations</Text>
      <Text style={styles.subtitle}>
        {conversations.length === 0
          ? 'Missed calls and texts land here'
          : `${activeCount} active of ${conversations.length}`}
      </Text>

      <View style={styles.search}>
        <Text style={styles.searchIcon}>⌕</Text>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search number, area, message…"
          placeholderTextColor={colors.textMuted}
          style={styles.searchInput}
          autoCapitalize="none"
          autoCorrect={false}
          accessibilityLabel="Search conversations"
          testID="conversations-search"
        />
        {query.length > 0 ? (
          <Pressable onPress={() => setQuery('')} hitSlop={10} accessibilityLabel="Clear search">
            <Text style={styles.clear}>✕</Text>
          </Pressable>
        ) : null}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}
      >
        {FILTERS.map((option) => {
          const selected = option.id === filter;
          return (
            <Pressable
              key={option.id}
              onPress={() => setFilter(option.id)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              testID={`filter-${option.id}`}
              style={[styles.chip, selected && styles.chipSelected]}
            >
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {visible.length === 0 ? (
        <EmptyState hasAny={conversations.length > 0} hasQuery={query.trim().length > 0} />
      ) : (
        <View style={styles.list}>
          {visible.map((conversation) => (
            <Row
              key={conversation.id}
              conversation={conversation}
              onPress={() => router.push(`/(app)/conversation/${conversation.id}`)}
            />
          ))}
        </View>
      )}

      {isDemoData && conversations.length > 0 ? (
        <View style={styles.notice}>
          <Text style={styles.noticeText}>
            These threads are sample data for the demo. No messages have been sent.
          </Text>
        </View>
      ) : null}
    </Screen>
  );
}

function Row({ conversation, onPress }: { conversation: Conversation; onPress: () => void }) {
  const missed = conversation.origin === 'missed_call';

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${formatPhone(conversation.phone)}, ${conversation.status}`}
      testID={`conversation-${conversation.id}`}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      <View style={[styles.avatar, missed && styles.avatarMissed]}>
        <Text style={styles.avatarIcon}>{missed ? '📞' : '💬'}</Text>
      </View>

      <View style={styles.rowBody}>
        <View style={styles.rowTop}>
          <Text style={styles.phone} numberOfLines={1}>
            {formatPhone(conversation.phone)}
          </Text>
          <Text style={styles.time}>{relativeTime(conversation.updatedAt)}</Text>
        </View>

        <Text style={styles.preview} numberOfLines={1}>
          {previewText(conversation)}
        </Text>

        <View style={styles.rowMeta}>
          {missed ? (
            <View style={styles.missedTag}>
              <Text style={styles.missedTagText}>Missed call</Text>
            </View>
          ) : null}
          <Text style={styles.area}>{areaLabel(conversation.phone)}</Text>
        </View>
      </View>

      <StatusPill status={conversation.status} blocked={conversation.blocked} />
    </Pressable>
  );
}

export function StatusPill({
  status,
  blocked,
}: {
  status: Conversation['status'];
  blocked: boolean;
}) {
  if (blocked) {
    return (
      <View style={[styles.pill, styles.pillBlocked]}>
        <Text style={[styles.pillText, styles.pillTextBlocked]}>Blocked</Text>
      </View>
    );
  }
  const active = status === 'active';
  return (
    <View style={[styles.pill, active ? styles.pillActive : styles.pillClosed]}>
      <Text style={[styles.pillText, active ? styles.pillTextActive : styles.pillTextClosed]}>
        {active ? 'Active' : 'Closed'}
      </Text>
    </View>
  );
}

function EmptyState({ hasAny, hasQuery }: { hasAny: boolean; hasQuery: boolean }) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Text style={styles.emptyIconText}>{hasAny ? '⌕' : '📵'}</Text>
      </View>
      <Text style={styles.emptyTitle}>
        {hasQuery ? 'Nothing matches that' : hasAny ? 'Nothing in this filter' : 'No conversations yet'}
      </Text>
      <Text style={styles.emptyBody}>
        {hasQuery
          ? 'Try a different number or word.'
          : hasAny
            ? 'Try another filter to see the rest.'
            : 'Missed calls and texts will appear here as soon as your number is live.'}
      </Text>
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
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },

  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    minHeight: 48,
    marginBottom: spacing.md,
  },
  searchIcon: { fontSize: 18, color: colors.textMuted },
  searchInput: { flex: 1, fontSize: fontSize.md, color: colors.text, paddingVertical: spacing.md },
  clear: { fontSize: fontSize.sm, color: colors.textMuted, fontWeight: '700' },

  filters: { gap: spacing.sm, paddingRight: spacing.lg, paddingBottom: spacing.lg },
  chip: {
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  chipSelected: { backgroundColor: colors.ink, borderColor: colors.ink },
  chipText: { fontSize: fontSize.sm, fontWeight: '700', color: colors.textMuted },
  chipTextSelected: { color: colors.textInverse },

  list: { gap: spacing.sm },
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
  avatar: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
  },
  avatarMissed: { backgroundColor: '#FFF1F0' },
  avatarIcon: { fontSize: 18 },
  rowBody: { flex: 1 },
  rowTop: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: spacing.sm },
  phone: { flexShrink: 1, fontSize: fontSize.md, fontWeight: '700', color: colors.text },
  time: { fontSize: fontSize.xs, color: colors.textMuted },
  preview: { marginTop: 2, fontSize: fontSize.sm, color: colors.textMuted },
  rowMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 6 },
  missedTag: {
    borderRadius: radius.sm,
    backgroundColor: '#FFF1F0',
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  missedTagText: { fontSize: 10, fontWeight: '800', color: colors.danger },
  area: { fontSize: fontSize.xs, color: colors.textMuted },

  pill: { borderRadius: radius.pill, paddingVertical: 4, paddingHorizontal: spacing.md },
  pillActive: { backgroundColor: '#E8F7EF' },
  pillClosed: { backgroundColor: colors.surfaceAlt },
  pillBlocked: { backgroundColor: colors.dangerSurface },
  pillText: { fontSize: 11, fontWeight: '800' },
  pillTextActive: { color: colors.accentPressed },
  pillTextClosed: { color: colors.textMuted },
  pillTextBlocked: { color: colors.danger },

  empty: { alignItems: 'center', paddingVertical: spacing.xxxl },
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
    paddingHorizontal: spacing.xl,
  },

  notice: {
    marginTop: spacing.lg,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.borderStrong,
    padding: spacing.md,
  },
  noticeText: { fontSize: fontSize.xs, lineHeight: 18, color: colors.textMuted, textAlign: 'center' },
});
