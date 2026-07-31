import React, { forwardRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';

import { colors, fontSize, radius, spacing } from '@/theme/theme';

type Props = TextInputProps & {
  label: string;
  /** Message shown beneath the field. Also flips the border to the danger colour. */
  error?: string | null;
  /** Renders a show/hide toggle and starts masked. */
  secure?: boolean;
  hint?: string;
};

export const TextField = forwardRef<TextInput, Props>(function TextField(
  { label, error, secure = false, hint, style, ...inputProps },
  ref,
) {
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>

      <View
        style={[
          styles.inputWrapper,
          focused && styles.inputWrapperFocused,
          !!error && styles.inputWrapperError,
        ]}
      >
        <TextInput
          ref={ref}
          style={[styles.input, style]}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={secure && !revealed}
          // Error text is not adjacent to the field for a screen reader, so bind it.
          accessibilityLabel={label}
          accessibilityHint={error ?? hint}
          onFocus={(e) => {
            setFocused(true);
            inputProps.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            inputProps.onBlur?.(e);
          }}
          {...inputProps}
        />

        {secure ? (
          <Pressable
            onPress={() => setRevealed((v) => !v)}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={revealed ? 'Hide password' : 'Show password'}
          >
            <Text style={styles.reveal}>{revealed ? 'Hide' : 'Show'}</Text>
          </Pressable>
        ) : null}
      </View>

      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    minHeight: 52,
  },
  inputWrapperFocused: {
    borderColor: colors.borderStrong,
  },
  inputWrapperError: {
    borderColor: colors.danger,
    backgroundColor: colors.dangerSurface,
  },
  input: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.text,
    paddingVertical: spacing.md,
  },
  reveal: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textMuted,
  },
  error: {
    marginTop: spacing.sm,
    fontSize: fontSize.sm,
    color: colors.danger,
  },
  hint: {
    marginTop: spacing.sm,
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
});
