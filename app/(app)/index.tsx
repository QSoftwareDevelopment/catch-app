import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/auth/AuthProvider';
import { catalogPlural, getSector } from '@/sectors/sectors';
import { colors, fontSize, radius, spacing } from '@/theme/theme';
import { ActionTile } from '@/ui/ActionTile';
import { FormBanner } from '@/ui/FormBanner';
import { Screen } from '@/ui/Screen';

/**
 * Home. Three primary destinations, plus Settings kept deliberately out of that group —
 * it lives in the header so a mis-tap while reaching for a daily action cannot land on
 * account settings.
 *
 * The middle tile is sector-driven: a restaurant sees "Our Menu Items", a realtor sees
 * "Our Property Listings". That mapping lives in src/sectors/sectors.ts, not here.
 */
export default function HomeScreen() {
  const router = useRouter();
  const { business, businessMissing } = useAuth();

  const sector = getSector(business?.sector);
  const catalogLabel = catalogPlural(business?.sector);

  return (
    <Screen scroll testID="home-screen">
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.greeting}>Your business</Text>
          <Text style={styles.businessName} numberOfLines={1}>
            {business?.name ?? 'Catch'}
          </Text>
          {sector ? (
            <View style={styles.sectorChip}>
              <Text style={styles.sectorIcon}>{sector.icon}</Text>
              <Text style={styles.sectorLabel}>{sector.label}</Text>
            </View>
          ) : null}
        </View>

        {/* Settings sits apart from the three primary tiles on purpose. */}
        <Pressable
          onPress={() => router.push('/(app)/settings')}
          accessibilityRole="button"
          accessibilityLabel="Settings"
          hitSlop={10}
          style={({ pressed }) => [styles.settingsButton, pressed && styles.settingsPressed]}
          testID="home-settings"
        >
          <Text style={styles.settingsIcon}>⚙︎</Text>
        </Pressable>
      </View>

      {businessMissing ? (
        <FormBanner
          tone="error"
          message={
            'Your account has no business record yet, so this screen cannot show your ' +
            'data. The Supabase migration still needs to be run against this project.'
          }
        />
      ) : null}

      <View style={styles.tiles}>
        <ActionTile
          icon="💬"
          label="Conversations"
          description="Every customer thread, in one inbox"
          onPress={() => router.push('/(app)/conversations')}
          testID="tile-conversations"
        />

        <ActionTile
          icon={sector?.icon ?? '📦'}
          label={`Our ${catalogLabel}`}
          description={`What customers can book and buy by text`}
          onPress={() => router.push('/(app)/catalog')}
          testID="tile-catalog"
        />

        <ActionTile
          icon="📣"
          label="Outreach"
          description="Reach past customers with a campaign"
          onPress={() => router.push('/(app)/outreach')}
          testID="tile-outreach"
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.lg,
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  headerText: {
    flex: 1,
  },
  greeting: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  businessName: {
    fontSize: fontSize.display,
    lineHeight: 38,
    fontWeight: '800',
    letterSpacing: -0.8,
    color: colors.text,
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
    paddingVertical: 5,
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
  },
  sectorIcon: {
    fontSize: fontSize.sm,
  },
  sectorLabel: {
    fontSize: fontSize.xs,
    fontWeight: '700',
    color: colors.textMuted,
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  settingsPressed: {
    opacity: 0.8,
    borderColor: colors.borderStrong,
  },
  settingsIcon: {
    fontSize: 20,
    color: colors.textMuted,
  },
  tiles: {
    gap: spacing.md,
  },
});
