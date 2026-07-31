import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { colors, fontSize, radius, spacing } from '@/theme/theme';

type Variant = 'primary' | 'secondary' | 'ghost';

type Props = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  /** Shows a spinner and blocks presses. Prevents double-submits creating two accounts. */
  loading?: boolean;
  disabled?: boolean;
  /** Set on dark backgrounds so ghost and secondary text stays readable. */
  onDark?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  onDark = false,
  style,
  testID,
}: Props) {
  const isBlocked = disabled || loading;

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={isBlocked}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isBlocked, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        variant === 'primary' && styles.primary,
        variant === 'secondary' && (onDark ? styles.secondaryOnDark : styles.secondary),
        variant === 'ghost' && styles.ghost,
        pressed && !isBlocked && styles.pressed,
        isBlocked && styles.blocked,
        style,
      ]}
    >
      {/* The label stays mounted under the spinner so the button keeps its width and the
          layout does not jump on submit. */}
      <View style={styles.content}>
        <Text
          style={[
            styles.label,
            variant === 'primary' && styles.labelPrimary,
            variant === 'secondary' && (onDark ? styles.labelOnDark : styles.labelSecondary),
            variant === 'ghost' && (onDark ? styles.labelOnDark : styles.labelGhost),
            loading && styles.labelHidden,
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>
        {loading ? (
          <ActivityIndicator
            style={StyleSheet.absoluteFill}
            color={variant === 'primary' ? colors.accentInk : colors.textMuted}
          />
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    borderRadius: radius.md,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: colors.accent,
  },
  secondary: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryOnDark: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.textInverseMuted,
  },
  ghost: {
    backgroundColor: 'transparent',
    minHeight: 44,
  },
  pressed: {
    opacity: 0.85,
  },
  blocked: {
    opacity: 0.6,
  },
  label: {
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  labelPrimary: {
    color: colors.accentInk,
  },
  labelSecondary: {
    color: colors.text,
  },
  labelGhost: {
    color: colors.textMuted,
  },
  labelOnDark: {
    color: colors.textInverse,
  },
  labelHidden: {
    opacity: 0,
  },
});
