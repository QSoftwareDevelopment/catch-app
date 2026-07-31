import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fontSize, radius, spacing } from '@/theme/theme';
import { Screen } from '@/ui/Screen';

type Props = {
  icon: string;
  title: string;
  /** What this screen will do once built. Written for the business owner, not for us. */
  summary: string;
  /** Concrete capabilities, so the screen communicates scope rather than just "soon". */
  bullets: string[];
  testID?: string;
};

/**
 * Placeholder for a destination that routes and renders but has no backend yet.
 *
 * It states plainly that the feature is not built. An empty screen that looks finished
 * reads as a bug, and a demo that implies working features invites the wrong feedback.
 */
export function ComingSoon({ icon, title, summary, bullets, testID }: Props) {
  const router = useRouter();

  return (
    <Screen scroll testID={testID}>
      <Pressable
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        hitSlop={10}
        style={styles.back}
      >
        <Text style={styles.backText}>‹ Back</Text>
      </Pressable>

      <View style={styles.iconWrap}>
        <Text style={styles.icon}>{icon}</Text>
      </View>

      <Text style={styles.title}>{title}</Text>
      <Text style={styles.summary}>{summary}</Text>

      <View style={styles.card}>
        <Text style={styles.cardHeading}>What this will do</Text>
        {bullets.map((line) => (
          <View key={line} style={styles.bulletRow}>
            <Text style={styles.bulletDot}>•</Text>
            <Text style={styles.bulletText}>{line}</Text>
          </View>
        ))}
      </View>

      <View style={styles.notice}>
        <Text style={styles.noticeText}>Not built yet — this screen is a placeholder.</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  backText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textMuted,
  },
  iconWrap: {
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
  icon: {
    fontSize: 28,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: '800',
    letterSpacing: -0.4,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  summary: {
    fontSize: fontSize.md,
    lineHeight: 24,
    color: colors.textMuted,
    marginBottom: spacing.xl,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.xl,
    marginBottom: spacing.lg,
  },
  cardHeading: {
    fontSize: fontSize.xs,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  bulletRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  bulletDot: {
    fontSize: fontSize.md,
    color: colors.accentPressed,
    lineHeight: 22,
  },
  bulletText: {
    flex: 1,
    fontSize: fontSize.sm,
    lineHeight: 22,
    color: colors.text,
  },
  notice: {
    borderRadius: radius.sm,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.borderStrong,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  noticeText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
