import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/auth/AuthProvider';
import { describeAuthError } from '@/auth/authErrors';
import type { SectorId } from '@/sectors/sectors';
import { colors, fontSize, spacing } from '@/theme/theme';
import { Button } from '@/ui/Button';
import { FormBanner } from '@/ui/FormBanner';
import { Screen } from '@/ui/Screen';
import { SectorPicker } from '@/ui/SectorPicker';
import { TextField } from '@/ui/TextField';
import {
  PASSWORD_MIN_LENGTH,
  isValid,
  validateBusinessName,
  validateEmail,
  validatePassword,
  validateSector,
} from '@/validation/validation';

type FieldErrors = {
  email: string | null;
  password: string | null;
  businessName: string | null;
  sector: string | null;
};

const NO_ERRORS: FieldErrors = {
  email: null,
  password: null,
  businessName: null,
  sector: null,
};

export default function SignUpScreen() {
  const router = useRouter();
  const { signUp } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [sector, setSector] = useState<SectorId | null>(null);

  const [errors, setErrors] = useState<FieldErrors>(NO_ERRORS);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    // Guard against a double tap slipping through before the disabled state renders.
    // Two accounts from one intent is the expensive failure here.
    if (submitting) return;

    const nextErrors: FieldErrors = {
      email: validateEmail(email),
      password: validatePassword(password),
      businessName: validateBusinessName(businessName),
      sector: validateSector(sector),
    };
    setErrors(nextErrors);
    setFormError(null);

    if (!isValid(nextErrors) || sector === null) return;

    setSubmitting(true);
    try {
      await signUp({ email, password, businessName, sector });
      // Supabase sends a confirmation link; nothing happens until it is clicked.
      router.replace({ pathname: '/(auth)/check-email', params: { email: email.trim() } });
    } catch (error) {
      const friendly = describeAuthError(error as Error);
      if (friendly?.field) {
        setErrors((prev) => ({ ...prev, [friendly.field as string]: friendly.message }));
      } else {
        setFormError(friendly?.message ?? null);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Screen scroll testID="sign-up-screen">
      <Text style={styles.title}>Create your account</Text>
      <Text style={styles.subtitle}>Two minutes, and your business is ready to text.</Text>

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
        returnKeyType="next"
        testID="sign-up-email"
      />

      <TextField
        label="Password"
        value={password}
        onChangeText={setPassword}
        error={errors.password}
        secure
        autoCapitalize="none"
        autoComplete="new-password"
        textContentType="newPassword"
        hint={`At least ${PASSWORD_MIN_LENGTH} characters`}
        placeholder="Choose a password"
        testID="sign-up-password"
      />

      <TextField
        label="Business name"
        value={businessName}
        onChangeText={setBusinessName}
        error={errors.businessName}
        autoCapitalize="words"
        autoComplete="organization"
        placeholder="Northside Heating & Air"
        testID="sign-up-business-name"
      />

      <SectorPicker
        value={sector}
        onChange={(next) => {
          setSector(next);
          setErrors((prev) => ({ ...prev, sector: null }));
        }}
        error={errors.sector}
      />

      <Button
        label="Create account"
        onPress={handleSubmit}
        loading={submitting}
        style={styles.submit}
        testID="sign-up-submit"
      />

      <Pressable
        onPress={() => router.replace('/(auth)/log-in')}
        accessibilityRole="button"
        style={styles.footer}
      >
        <Text style={styles.footerText}>
          Already have an account? <Text style={styles.footerLink}>Log in</Text>
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
  submit: {
    marginTop: spacing.sm,
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
