import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/auth/AuthProvider';
import { getSector, sectorLabel } from '@/sectors/sectors';
import { colors, fontSize, radius, spacing } from '@/theme/theme';
import { Button } from '@/ui/Button';
import { FormBanner } from '@/ui/FormBanner';
import { Screen } from '@/ui/Screen';

/**
 * Account settings, and the only place to sign out.
 *
 * Sign-out lives here rather than on Home so it cannot be hit by accident while
 * reaching for a daily action.
 */
export default function SettingsScreen() {
  const router = useRouter();
  const { session, business, signOut } = useAuth();

  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sector = getSector(business?.sector);

  async function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    setError(null);
    try {
      await signOut();
      // No navigation here — the root layout reacts to the cleared session.
    } catch {
      setError('Could not sign out. Check your connection and try again.');
      setSigningOut(false);
    }
  }

  return (
    <Screen scroll contentStyle={styles.content} testID="settings-screen">
      <View>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={10}
          style={styles.back}
        >
          <Text style={styles.backText}>‹ Back</Text>
        </Pressable>

        <Text style={styles.title}>Settings</Text>

        <FormBanner message={error} />

        <View style={styles.card}>
          <Text style={styles.cardHeading}>Business</Text>

          <Row label="Name" value={business?.name ?? 'Not set'} />
          <Row
            label="Sector"
            value={sector ? `${sector.icon}  ${sector.label}` : sectorLabel(business?.sector)}
          />
          <Row label="Sells" value={sector?.catalogPlural ?? 'Offerings'} last />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardHeading}>Account</Text>
          <Row label="Email" value={session?.user.email ?? 'Unknown'} last />
        </View>

        <Text style={styles.note}>
          Changing your business name or sector is coming with the next release. Sector
          decides which features you see, so it will need a confirmation step.
        </Text>
      </View>

      <Button
        label="Sign out"
        variant="secondary"
        onPress={handleSignOut}
        loading={signingOut}
        testID="settings-sign-out"
      />
    </Screen>
  );
}

function Row({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.row, last && styles.rowLast]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  back: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  backText: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.textMuted,
  },
  title: {
    fontSize: fontSize.display,
    lineHeight: 38,
    fontWeight: '800',
    letterSpacing: -0.8,
    color: colors.text,
    marginBottom: spacing.xl,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    marginBottom: spacing.lg,
  },
  cardHeading: {
    fontSize: fontSize.xs,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowLabel: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
  },
  rowValue: {
    flexShrink: 1,
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.text,
  },
  note: {
    fontSize: fontSize.xs,
    lineHeight: 18,
    color: colors.textMuted,
    paddingHorizontal: spacing.xs,
  },
});
