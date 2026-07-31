import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/ui/Screen';
import { Button } from '@/ui/Button';
import { colors, fontSize, spacing } from '@/theme/theme';

/**
 * Landing screen — the first thing an unauthenticated visitor sees.
 *
 * The audience is a business owner, not a consumer, so the copy leads with the outcome
 * (revenue from text) rather than with the mechanism.
 */

const PROOF_POINTS = [
  { icon: '💬', text: 'Sell over text, where customers already reply' },
  { icon: '⚡', text: 'Quotes, bookings and payments in one thread' },
  { icon: '🧰', text: 'Tuned to your trade, not a generic inbox' },
];

export default function LandingScreen() {
  const router = useRouter();

  return (
    <Screen dark contentStyle={styles.content} testID="landing-screen">
      <View style={styles.hero}>
        <Text style={styles.wordmark}>Catch</Text>

        <Text style={styles.headline}>Turn text messages into revenue.</Text>

        <Text style={styles.subhead}>
          Catch gives your business a number customers can text to book, buy and get
          quotes — without another app to install.
        </Text>

        <View style={styles.proof}>
          {PROOF_POINTS.map((point) => (
            <View key={point.text} style={styles.proofRow}>
              <Text style={styles.proofIcon}>{point.icon}</Text>
              <Text style={styles.proofText}>{point.text}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.actions}>
        <Button
          label="Get started"
          onPress={() => router.push('/(auth)/sign-up')}
          testID="landing-get-started"
        />
        <Button
          label="I already have an account"
          variant="secondary"
          onDark
          onPress={() => router.push('/(auth)/log-in')}
          testID="landing-log-in"
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  hero: {
    paddingTop: spacing.xxl,
  },
  wordmark: {
    fontSize: fontSize.xl,
    fontWeight: '800',
    letterSpacing: -0.5,
    color: colors.accent,
    marginBottom: spacing.xxxl,
  },
  headline: {
    fontSize: fontSize.display,
    lineHeight: 40,
    fontWeight: '800',
    letterSpacing: -0.8,
    color: colors.textInverse,
    marginBottom: spacing.lg,
  },
  subhead: {
    fontSize: fontSize.md,
    lineHeight: 24,
    color: colors.textInverseMuted,
    marginBottom: spacing.xxl,
  },
  proof: {
    gap: spacing.lg,
  },
  proofRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  proofIcon: {
    fontSize: fontSize.lg,
  },
  proofText: {
    flex: 1,
    fontSize: fontSize.sm,
    lineHeight: 20,
    color: colors.textInverse,
  },
  actions: {
    gap: spacing.md,
    paddingTop: spacing.xxl,
  },
});
