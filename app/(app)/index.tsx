import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/auth/AuthProvider';
import { getSector } from '@/sectors/sectors';
import { colors, fontSize, radius, spacing } from '@/theme/theme';
import { Button } from '@/ui/Button';
import { FormBanner } from '@/ui/FormBanner';
import { Screen } from '@/ui/Screen';

/**
 * Placeholder home, replaced in slice 2 by the real product surface.
 *
 * It earns its place by proving the whole loop end to end: the session survived, the
 * business row was created by the signup trigger, RLS let the owner read it, and sign-out
 * returns to the landing screen.
 */
export default function HomeScreen() {
  const { session, business, businessMissing, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sector = getSector(business?.sector);

  async function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    setError(null);
    try {
      await signOut();
      // No navigation call — the root layout reacts to the cleared session.
    } catch {
      setError('Could not sign out. Check your connection and try again.');
      setSigningOut(false);
    }
  }

  return (
    <Screen scroll contentStyle={styles.content} testID="home-screen">
      <View>
        <Text style={styles.eyebrow}>Signed in as {session?.user.email}</Text>
        <Text style={styles.title}>{business?.name ?? 'Your business'}</Text>

        {sector ? (
          <View style={styles.sectorChip}>
            <Text style={styles.sectorIcon}>{sector.icon}</Text>
            <Text style={styles.sectorLabel}>{sector.label}</Text>
          </View>
        ) : null}

        <FormBanner message={error} />

        {businessMissing ? (
          <FormBanner
            tone="error"
            message={
              'Your account has no business record. This usually means the signup trigger ' +
              'in supabase/migrations/0001_businesses.sql has not been run against this project.'
            }
          />
        ) : null}

        <View style={styles.card}>
          <Text style={styles.cardTitle}>You are set up.</Text>
          <Text style={styles.cardBody}>
            {sector
              ? `Next, Catch will connect a number your ${sector.label.toLowerCase()} ` +
                'customers can text, and turn those threads into bookings and sales.'
              : 'Next, Catch will connect a number your customers can text.'}
          </Text>
        </View>
      </View>

      <Button
        label="Sign out"
        variant="secondary"
        onPress={handleSignOut}
        loading={signingOut}
        testID="home-sign-out"
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  eyebrow: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: fontSize.display,
    lineHeight: 40,
    fontWeight: '800',
    letterSpacing: -0.8,
    color: colors.text,
    marginBottom: spacing.md,
  },
  sectorChip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  sectorIcon: {
    fontSize: fontSize.md,
  },
  sectorLabel: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.text,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.xl,
  },
  cardTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  cardBody: {
    fontSize: fontSize.sm,
    lineHeight: 22,
    color: colors.textMuted,
  },
});
