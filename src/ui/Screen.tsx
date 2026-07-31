import React, { type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing } from '@/theme/theme';

type Props = {
  children: ReactNode;
  /** Dark brand background. Used by the landing screen. */
  dark?: boolean;
  /**
   * Wraps content in a ScrollView. Required on form screens: the keyboard covers roughly
   * half a small phone, and without it the submit button is unreachable.
   */
  scroll?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  testID?: string;
};

export function Screen({ children, dark = false, scroll = false, contentStyle, testID }: Props) {
  const body = scroll ? (
    <ScrollView
      contentContainerStyle={[styles.content, contentStyle]}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.content, styles.flex, contentStyle]}>{children}</View>
  );

  return (
    <SafeAreaView
      testID={testID}
      style={[styles.flex, dark ? styles.dark : styles.light]}
      edges={['top', 'bottom']}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        // Android already pans the window; adding padding on top of that double-shifts.
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {body}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  light: {
    backgroundColor: colors.surfaceAlt,
  },
  dark: {
    backgroundColor: colors.ink,
  },
  content: {
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
  },
});
