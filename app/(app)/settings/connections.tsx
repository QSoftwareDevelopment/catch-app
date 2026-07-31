import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/auth/AuthProvider';
import { useConnections } from '@/connections/ConnectionsProvider';
import {
  CATEGORY_LABELS,
  integrationsForSector,
  type Integration,
  type IntegrationCategory,
} from '@/connections/integrations';
import { sectorLabel } from '@/sectors/sectors';
import { colors, fontSize, radius, spacing } from '@/theme/theme';
import { Screen } from '@/ui/Screen';

/**
 * Connected systems.
 *
 * Connecting is what stops the assistant guessing: the POS knows the real menu and the
 * real prices, the booking system knows which slots are free. It is also what makes
 * event triggers real — "a showing slot opens" has to come from a calendar, not from
 * someone remembering to press a button.
 *
 * Only the apps a given trade would actually run are offered.
 */
export default function ConnectionsScreen() {
  const router = useRouter();
  const { business } = useAuth();
  const { isConnected, connect, disconnect, isDemoData } = useConnections();

  const available = integrationsForSector(business?.sector);
  const connectedCount = available.filter((i) => isConnected(i.id)).length;

  // Grouped so the owner sees "these are my tills, these are my calendars" rather than
  // one undifferentiated list.
  const groups = available.reduce<Record<string, Integration[]>>((acc, integration) => {
    (acc[integration.category] ??= []).push(integration);
    return acc;
  }, {});

  return (
    <Screen scroll testID="connections-screen">
      <Pressable onPress={() => router.back()} hitSlop={10} style={styles.back}>
        <Text style={styles.backText}>‹ Back</Text>
      </Pressable>

      <Text style={styles.title}>Connections</Text>
      <Text style={styles.subtitle}>
        {connectedCount === 0
          ? `Apps a ${sectorLabel(business?.sector).toLowerCase()} business usually runs. Connect one and your assistant stops guessing.`
          : `${connectedCount} connected of ${available.length}`}
      </Text>

      {Object.entries(groups).map(([category, items]) => (
        <View key={category} style={styles.group}>
          <Text style={styles.groupTitle}>
            {CATEGORY_LABELS[category as IntegrationCategory] ?? category}
          </Text>

          <View style={styles.groupBody}>
            {items.map((integration) => {
              const connected = isConnected(integration.id);
              return (
                <View key={integration.id} style={styles.row} testID={`integration-${integration.id}`}>
                  <View style={styles.icon}>
                    <Text style={styles.iconText}>{integration.icon}</Text>
                  </View>

                  <View style={styles.body}>
                    <Text style={styles.name}>{integration.name}</Text>
                    <Text style={styles.blurb}>{integration.blurb}</Text>
                  </View>

                  <Pressable
                    onPress={() =>
                      connected ? disconnect(integration.id) : connect(integration.id)
                    }
                    accessibilityRole="button"
                    accessibilityLabel={`${connected ? 'Disconnect' : 'Connect'} ${integration.name}`}
                    testID={`toggle-${integration.id}`}
                    style={[styles.action, connected && styles.actionConnected]}
                  >
                    <Text style={[styles.actionText, connected && styles.actionTextConnected]}>
                      {connected ? 'Connected' : 'Connect'}
                    </Text>
                  </Pressable>
                </View>
              );
            })}
          </View>
        </View>
      ))}

      <View style={styles.notice}>
        <Text style={styles.noticeText}>
          {isDemoData
            ? 'Sample connections for the demo. Nothing is authorised and no data is synced.'
            : 'Connecting will open the provider’s own login. Not wired up yet — nothing is authorised or synced.'}
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: { alignSelf: 'flex-start', paddingVertical: spacing.sm, marginBottom: spacing.md },
  backText: { fontSize: fontSize.md, fontWeight: '600', color: colors.textMuted },
  title: { fontSize: fontSize.xl, fontWeight: '800', letterSpacing: -0.4, color: colors.text },
  subtitle: {
    fontSize: fontSize.sm,
    lineHeight: 21,
    color: colors.textMuted,
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },

  group: { marginBottom: spacing.xl },
  groupTitle: {
    fontSize: fontSize.xs,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  groupBody: { gap: spacing.sm },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.lg,
  },
  icon: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
  },
  iconText: { fontSize: 17 },
  body: { flex: 1 },
  name: { fontSize: fontSize.sm, fontWeight: '700', color: colors.text },
  blurb: { marginTop: 2, fontSize: fontSize.xs, lineHeight: 16, color: colors.textMuted },

  action: {
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 7,
    paddingHorizontal: spacing.md,
  },
  actionConnected: { backgroundColor: '#E8F7EF', borderColor: '#E8F7EF' },
  actionText: { fontSize: fontSize.xs, fontWeight: '800', color: colors.textMuted },
  actionTextConnected: { color: colors.accentPressed },

  notice: {
    borderRadius: radius.sm,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.borderStrong,
    padding: spacing.md,
  },
  noticeText: { fontSize: fontSize.xs, lineHeight: 18, color: colors.textMuted, textAlign: 'center' },
});
