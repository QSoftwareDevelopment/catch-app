import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { useAuth } from '@/auth/AuthProvider';
import { describeAuthError } from '@/auth/authErrors';
import { colors, fontSize, spacing } from '@/theme/theme';
import { Button } from '@/ui/Button';
import { FormBanner } from '@/ui/FormBanner';
import { Screen } from '@/ui/Screen';
import { TextField } from '@/ui/TextField';
import { isValid, validateEmail, validatePasswordPresent } from '@/validation/validation';

export default function LogInScreen() {
  const router = useRouter();
  const { signIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email: string | null; password: string | null }>({
    email: null,
    password: null,
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (submitting) return;

    // Login deliberately does not enforce the signup password rules. If they were
    // tightened after an account was created, the old password must still work.
    const nextErrors = {
      email: validateEmail(email),
      password: validatePasswordPresent(password),
    };
    setErrors(nextErrors);
    setFormError(null);

    if (!isValid(nextErrors)) return;

    setSubmitting(true);
    try {
      await signIn(email, password);
      // No navigation here — the root layout moves the user once the session lands.
    } catch (error) {
      const friendly = describeAuthError(error as Error);
      setFormError(friendly?.message ?? null);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen scroll testID="log-in-screen">
      <Text style={styles.title}>Welcome back</Text>
      <Text style={styles.subtitle}>Log in to pick up where your customers left off.</Text>

      <FormBanner message={formError} />

      <TextField
        label="Work email"
        value={email}
        onChangeText={setEmail}
        error={errors.email}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
        placeholder="you@yourbusiness.com"
        testID="log-in-email"
      />

      <TextField
        label="Password"
        value={password}
        onChangeText={setPassword}
        error={errors.password}
        secure
        autoCapitalize="none"
        autoComplete="current-password"
        textContentType="password"
        placeholder="Your password"
        onSubmitEditing={handleSubmit}
        returnKeyType="go"
        testID="log-in-password"
      />

      <Pressable
        onPress={() => router.push('/(auth)/forgot-password')}
        accessibilityRole="button"
        style={styles.forgot}
      >
        <Text style={styles.forgotText}>Forgot password?</Text>
      </Pressable>

      <Button
        label="Log in"
        onPress={handleSubmit}
        loading={submitting}
        testID="log-in-submit"
      />

      <Pressable
        onPress={() => router.replace('/(auth)/sign-up')}
        accessibilityRole="button"
        style={styles.footer}
      >
        <Text style={styles.footerText}>
          New to Catch? <Text style={styles.footerLink}>Create an account</Text>
        </Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: fontSize.xl,
    fontWeight: '800',
    letterSpacing: -0.4,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginBottom: spacing.xl,
  },
  forgot: {
    alignSelf: 'flex-end',
    marginBottom: spacing.lg,
    paddingVertical: spacing.xs,
  },
  forgotText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textMuted,
  },
  footer: {
    marginTop: spacing.xl,
    alignItems: 'center',
  },
  footerText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  footerLink: {
    color: colors.text,
    fontWeight: '700',
  },
});
