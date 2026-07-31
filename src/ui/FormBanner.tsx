import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, fontSize, radius, spacing } from '@/theme/theme';

type Props = {
  message: string | null;
  tone?: 'error' | 'info';
};

/**
 * Form-level message, for errors that belong to the submission rather than to one field
 * — a failed network call, a rate limit, a rejected sign-in.
 *
 * Rendered inline instead of as an Alert so it stays on screen while the user fixes the
 * problem, and so it is readable by a screen reader in document order.
 */
export function FormBanner({ message, tone = 'error' }: Props) {
  if (!message) return null;

  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={[styles.base, tone === 'error' ? styles.error : styles.info]}
    >
      <Text style={[styles.text, tone === 'error' ? styles.errorText : styles.infoText]}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
  },
  error: {
    backgroundColor: colors.dangerSurface,
    borderColor: colors.danger,
  },
  info: {
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.border,
  },
  text: {
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
  errorText: {
    color: colors.danger,
  },
  infoText: {
    color: colors.textMuted,
  },
});
