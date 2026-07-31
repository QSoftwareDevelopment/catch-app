import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { useConversations } from '@/conversations/ConversationsProvider';
import { areaLabel, formatPhone, messageTime } from '@/conversations/format';
import type { Message } from '@/conversations/types';
import { colors, fontSize, radius, spacing } from '@/theme/theme';
import { Screen } from '@/ui/Screen';

/**
 * A single SMS thread.
 *
 * Outbound messages are right-aligned and branded; the customer sits left. Catch's own
 * automatic replies are labelled as such, so the owner can always tell what was sent on
 * their behalf versus what they typed themselves — that distinction matters when a
 * customer is quoting a price back at them.
 */
export default function ConversationScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getConversation, setStatus, setBlocked, sendMessage, isDemoData } = useConversations();

  const [draft, setDraft] = useState('');
  const conversation = getConversation(String(id));

  if (!conversation) {
    return (
      <Screen scroll testID="conversation-missing">
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.back}>
          <Text style={styles.backText}>‹ Back</Text>
        </Pressable>
        <Text style={styles.title}>Conversation not found</Text>
        <Text style={styles.subtitle}>It may have been closed on another device.</Text>
      </Screen>
    );
  }

  const closed = conversation.status === 'closed';

  function handleSend() {
    if (!draft.trim() || !conversation) return;
    sendMessage(conversation.id, draft);
    setDraft('');
  }

  return (
    <Screen scroll contentStyle={styles.content} testID="conversation-screen">
      <View>
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Back to conversations"
            style={styles.backButton}
          >
            <Text style={styles.backArrow}>←</Text>
          </Pressable>

          <View style={styles.headerText}>
            <Text style={styles.phone}>{formatPhone(conversation.phone)}</Text>
            <Text style={styles.headerMeta}>
              {conversation.origin === 'missed_call' ? 'Missed call' : 'SMS'} ·{' '}
              {areaLabel(conversation.phone)}
            </Text>
          </View>
        </View>

        {conversation.blocked ? (
          <View style={styles.blockedBanner}>
            <Text style={styles.blockedText}>
              Catch will never text this number again. Tap Unblock to allow it.
            </Text>
          </View>
        ) : null}

        <View style={styles.thread}>
          {conversation.messages.map((message) => (
            <Bubble key={message.id} message={message} />
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        {/* Reply box first: the common action gets the reachable position. */}
        <View style={styles.composer}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder={closed ? 'Reply to reopen…' : 'Type a reply…'}
            placeholderTextColor={colors.textMuted}
            style={styles.composerInput}
            multiline
            accessibilityLabel="Reply"
            testID="conversation-input"
          />
          <Pressable
            onPress={handleSend}
            disabled={!draft.trim()}
            accessibilityRole="button"
            accessibilityLabel="Send reply"
            testID="conversation-send"
            style={[styles.send, !draft.trim() && styles.sendDisabled]}
          >
            <Text style={styles.sendText}>↑</Text>
          </Pressable>
        </View>

        <View style={styles.actions}>
          <Pressable
            onPress={() => setStatus(conversation.id, closed ? 'active' : 'closed')}
            accessibilityRole="button"
            testID="conversation-toggle-status"
            style={styles.action}
          >
            <Text style={styles.actionText}>{closed ? 'Reopen' : 'Mark as closed'}</Text>
          </Pressable>

          <Pressable
            onPress={() => setBlocked(conversation.id, !conversation.blocked)}
            accessibilityRole="button"
            testID="conversation-toggle-block"
            style={styles.action}
          >
            <Text style={[styles.actionText, !conversation.blocked && styles.actionDanger]}>
              {conversation.blocked ? 'Unblock' : 'Never text this number'}
            </Text>
          </Pressable>
        </View>

        {isDemoData ? (
          <Text style={styles.demoNote}>
            Sample thread. Replies stay on this device — nothing is sent.
          </Text>
        ) : null}
      </View>
    </Screen>
  );
}

function Bubble({ message }: { message: Message }) {
  const outbound = message.author !== 'customer';

  return (
    <View style={[styles.bubbleRow, outbound ? styles.rowRight : styles.rowLeft]}>
      <View style={[styles.bubble, outbound ? styles.bubbleOut : styles.bubbleIn]}>
        <Text style={[styles.bubbleText, outbound && styles.bubbleTextOut]}>{message.body}</Text>
        <Text style={[styles.bubbleTime, outbound && styles.bubbleTimeOut]}>
          {/* Naming the sender is what separates an automatic reply from the owner's
              own words — they are answerable for both, but differently. */}
          {message.author === 'catch' ? 'Catch · ' : message.author === 'owner' ? 'You · ' : ''}
          {messageTime(message.at)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, justifyContent: 'space-between' },

  back: { alignSelf: 'flex-start', paddingVertical: spacing.sm, marginBottom: spacing.md },
  backText: { fontSize: fontSize.md, fontWeight: '600', color: colors.textMuted },

  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.lg },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  backArrow: { fontSize: 18, color: colors.text },
  headerText: { flex: 1 },
  phone: { fontSize: fontSize.lg, fontWeight: '800', letterSpacing: -0.3, color: colors.text },
  headerMeta: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2 },

  title: { fontSize: fontSize.xl, fontWeight: '800', color: colors.text, marginBottom: spacing.sm },
  subtitle: { fontSize: fontSize.sm, color: colors.textMuted },

  blockedBanner: {
    backgroundColor: colors.dangerSurface,
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: radius.sm,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  blockedText: { fontSize: fontSize.sm, color: colors.danger, lineHeight: 19 },

  thread: { gap: spacing.md, paddingBottom: spacing.lg },
  bubbleRow: { flexDirection: 'row' },
  rowLeft: { justifyContent: 'flex-start' },
  rowRight: { justifyContent: 'flex-end' },
  bubble: { maxWidth: '82%', borderRadius: radius.lg, paddingVertical: spacing.md, paddingHorizontal: spacing.lg },
  bubbleIn: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  bubbleOut: { backgroundColor: colors.ink },
  bubbleText: { fontSize: fontSize.sm, lineHeight: 21, color: colors.text },
  bubbleTextOut: { color: colors.textInverse },
  bubbleTime: { marginTop: 6, fontSize: 10, color: colors.textMuted },
  bubbleTimeOut: { color: colors.textInverseMuted },

  footer: { gap: spacing.md, paddingTop: spacing.lg },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  composerInput: { flex: 1, fontSize: fontSize.sm, color: colors.text, maxHeight: 120, paddingVertical: spacing.sm },
  send: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
  },
  sendDisabled: { opacity: 0.4 },
  sendText: { fontSize: 17, fontWeight: '800', color: colors.accentInk },

  actions: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
  action: { paddingVertical: spacing.sm },
  actionText: { fontSize: fontSize.sm, fontWeight: '700', color: colors.textMuted },
  actionDanger: { color: colors.danger },

  demoNote: { fontSize: fontSize.xs, color: colors.textMuted, textAlign: 'center' },
});
