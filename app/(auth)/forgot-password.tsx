import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { useAuth } from '@/auth/AuthProvider';
import { describeAuthError } from '@/auth/authErrors';
import { colors, fontSize, spacing } from '@/theme/theme';
import { Button } from '@/ui/Button';
import { FormBanner } from '@/ui/FormBanner';
import { Screen } from '@/ui/Screen';
import { TextField } from '@/ui/TextField';
import { validateEmail } from '@/validation/validation';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { sendPasswordReset } = useAuth();

  const [email, setEmail] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (submitting) return;

    const error = validateEmail(email);
    setFieldError(error);
    setFormError(null);
    if (error) return;

    setSubmitting(true);
    try {
      await sendPasswordReset(email);
      setSent(true);
    } catch (caught) {
      setFormError(describeAuthError(caught as Error)?.message ?? null);
    } finally {
      setSubmitting(false);
    }
  }

  // Deliberately identical whether or not the address has an account. Saying "no account
  // found" would let anyone test which of a business's addresses are registered.
  if (sent) {
    return (
      <Screen scroll testID="forgot-password-sent">
        <Text style={styles.title}>Check your email</Text>
        <Text style={styles.body}>
          If <Text style={styles.email}>{email.trim()}</Text> has a Catch account, a reset
          link is on its way.
        </Text>
        <Button
          label="Back to log in"
          onPress={() => router.replace('/(auth)/log-in')}
          testID="forgot-password-done"
        />
      </Screen>
    );
  }

  return (
    <Screen scroll testID="forgot-password-screen">
      <Text style={styles.title}>Reset your password</Text>
      <Text style={styles.body}>
        Enter the email you signed up with and we will send a link to set a new password.
      </Text>

      <FormBanner message={formError} />

      <TextField
        label="Work email"
        value={email}
        onChangeText={setEmail}
        error={fieldError}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
        placeholder="you@yourbusiness.com"
        onSubmitEditing={handleSubmit}
        returnKeyType="go"
        testID="forgot-password-email"
      />

      <Button
        label="Send reset link"
        onPress={handleSubmit}
        loading={submitting}
        testID="forgot-password-submit"
      />

      <Button
        label="Back"
        variant="ghost"
        onPress={() => router.back()}
        style={styles.back}
        testID="forgot-password-back"
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: fontSize.xl,
    fontWeight: '800',
    letterSpacing: -0.4,
    color: colors.text,
    marginTop: spacing.xxl,
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
