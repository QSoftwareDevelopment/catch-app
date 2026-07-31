import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fontSize, radius, spacing } from '@/theme/theme';

type Props = {
  icon: string;
  label: string;
  description: string;
  onPress: () => void;
  /** Optional count shown as a pill — unread conversations, catalog size, and so on. */
  badge?: number;
  testID?: string;
};

/**
 * A primary destination on the home screen.
 *
 * Full-width rows rather than a grid: the labels are sector-driven and vary in length
 * ("Our Services" against "Our Memberships & Classes"), and a grid would either truncate
 * the long ones or force every tile to the tallest.
 */
export function ActionTile({ icon, label, description, onPress, badge, testID }: Props) {
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={
        badge ? `${label}, ${badge} waiting. ${description}` : `${label}. ${description}`
      }
      style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
    >
      <View style={styles.iconWrap}>
        <Text style={styles.icon}>{icon}</Text>
      </View>

      <View style={styles.body}>
        <View style={styles.labelRow}>
          <Text style={styles.label} numberOfLines={1}>
            {label}
          </Text>
          {badge ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.description} numberOfLines={2}>
          {description}
        </Text>
      </View>

      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    minHeight: 84,
  },
  pressed: {
    opacity: 0.85,
    borderColor: colors.borderStrong,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
  },
  icon: {
    fontSize: 22,
  },
  body: {
    flex: 1,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  label: {
    flexShrink: 1,
    fontSize: fontSize.lg,
    fontWeight: '700',
    letterSpacing: -0.2,
    color: colors.text,
  },
  badge: {
    minWidth: 24,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: fontSize.xs,
    fontWeight: '800',
    color: colors.accentInk,
  },
  description: {
    marginTop: 3,
    fontSize: fontSize.sm,
    lineHeight: 19,
    color: colors.textMuted,
  },
  chevron: {
    fontSize: 26,
    lineHeight: 26,
    color: colors.borderStrong,
    marginTop: -2,
  },
});
