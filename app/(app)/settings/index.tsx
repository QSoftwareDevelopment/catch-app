import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/auth/AuthProvider';
import { useConnections } from '@/connections/ConnectionsProvider';
import { integrationsForSector } from '@/connections/integrations';
import { formatPhone } from '@/conversations/format';
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
  const { number, isConnected } = useConnections();

  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sector = getSector(business?.sector);
  const available = integrationsForSector(business?.sector);
  const connectedCount = available.filter((i) => isConnected(i.id)).length;

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

        {/* The number comes first: nothing else in the product works without it. No
            number means no conversations to receive and nothing to send outreach from. */}
        <Pressable
          onPress={() => router.push('/(app)/settings/number')}
          accessibilityRole="button"
          testID="settings-number"
          style={({ pressed }) => [styles.navCard, pressed && styles.navCardPressed]}
        >
          <View style={styles.navIcon}>
            <Text style={styles.navIconText}>📞</Text>
          </View>
          <View style={styles.navBody}>
            <Text style={styles.navTitle}>Catch number</Text>
            <Text style={styles.navValue}>
              {number ? formatPhone(number.e164) : 'Not set up yet'}
            </Text>
          </View>
          {number ? null : (
            <View style={styles.needed}>
              <Text style={styles.neededText}>Needed</Text>
            </View>
          )}
          <Text style={styles.chevron}>›</Text>
        </Pressable>

        <Pressable
          onPress={() => router.push('/(app)/settings/connections')}
          accessibilityRole="button"
          testID="settings-connections"
          style={({ pressed }) => [styles.navCard, pressed && styles.navCardPressed]}
        >
          <View style={styles.navIcon}>
            <Text style={styles.navIconText}>🔌</Text>
          </View>
          <View style={styles.navBody}>
            <Text style={styles.navTitle}>Connections</Text>
            <Text style={styles.navValue}>
              {connectedCount === 0
                ? `${available.length} available`
                : `${connectedCount} connected`}
            </Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </Pressable>

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
  navCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  navCardPressed: { opacity: 0.85, borderColor: colors.borderStrong },
  navIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
  },
  navIconText: { fontSize: 17 },
  navBody: { flex: 1 },
  navTitle: { fontSize: fontSize.sm, fontWeight: '700', color: colors.text },
  navValue: { marginTop: 2, fontSize: fontSize.xs, color: colors.textMuted },
  needed: {
    borderRadius: radius.pill,
    backgroundColor: colors.dangerSurface,
    paddingVertical: 3,
    paddingHorizontal: spacing.sm,
  },
  neededText: { fontSize: 10, fontWeight: '800', color: colors.danger },
  chevron: { fontSize: 22, color: colors.borderStrong },

  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    marginBottom: spacing.lg,
    marginTop: spacing.md,
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
