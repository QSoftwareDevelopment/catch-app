import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/auth/AuthProvider';
import { describeAuthError } from '@/auth/authErrors';
import { colors, fontSize, spacing } from '@/theme/theme';
import { Button } from '@/ui/Button';
import { FormBanner } from '@/ui/FormBanner';
import { Screen } from '@/ui/Screen';

/**
 * Shown straight after signup. The account exists but is unusable until the emailed link
 * is clicked, so this screen exists to explain that rather than leaving the user staring
 * at a login form that rejects the password they just chose.
 */
export default function CheckEmailScreen() {
  const router = useRouter();
  const { resendConfirmation } = useAuth();
  const { email } = useLocalSearchParams<{ email?: string }>();

  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  async function handleResend() {
    if (sending || !email) return;
    setSending(true);
    setNotice(null);
    setError(null);
    try {
      await resendConfirmation(email);
      setNotice('Sent. Give it a minute, then check your spam folder too.');
    } catch (caught) {
      setError(describeAuthError(caught as Error)?.message ?? null);
    } finally {
      setSending(false);
    }
  }

  return (
    <Screen scroll testID="check-email-screen">
      <View style={styles.badge}>
        <Text style={styles.badgeIcon}>📬</Text>
      </View>

      <Text style={styles.title}>Confirm your email</Text>
      <Text style={styles.body}>
        We sent a confirmation link to{' '}
        <Text style={styles.email}>{email ?? 'your inbox'}</Text>. Tap it and your account
        is live.
      </Text>

      <FormBanner message={error} />
      <FormBanner message={notice} tone="info" />

      {email ? (
        <Button
          label="Resend the link"
          variant="secondary"
          onPress={handleResend}
          loading={sending}
          testID="check-email-resend"
        />
      ) : null}

      <Button
        label="Back to log in"
        variant="ghost"
        onPress={() => router.replace('/(auth)/log-in')}
        style={styles.back}
        testID="check-email-back"
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  badge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xl,
    marginTop: spacing.xxl,
  },
  badgeIcon: {
    fontSize: 28,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: '800',
    letterSpacing: -0.4,
    color: colors.text,
    marginBottom: spacing.md,
  },
  body: {
    fontSize: fontSize.md,
    lineHeight: 24,
    color: colors.textMuted,
    marginBottom: spacing.xl,
  },
  email: {
    color: colors.text,
    fontWeight: '700',
  },
  back: {
    marginTop: spacing.md,
  },
});
