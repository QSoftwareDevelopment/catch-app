import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/auth/AuthProvider';
import { SECTORS } from '@/sectors/sectors';
import { colors, fontSize, radius, spacing } from '@/theme/theme';

/**
 * Floating control shown only in demo mode.
 *
 * Switching sector here re-labels the whole app instantly — the home tile, the catalog
 * screen's title and body copy, the settings summary. That is the point: reviewing eight
 * sectors' wording otherwise means creating eight accounts.
 *
 * Collapsible because it overlays the app it is there to demonstrate.
 */
export function DemoBar() {
  const { demoEnabled, demoSector, setDemoSector } = useAuth();
  const [open, setOpen] = useState(false);

  if (!demoEnabled) return null;

  return (
    <View style={styles.wrap} pointerEvents="box-none">
      {open ? (
        <View style={styles.panel}>
          <View style={styles.panelHead}>
            <Text style={styles.panelTitle}>Preview as</Text>
            <Pressable onPress={() => setOpen(false)} hitSlop={10} accessibilityRole="button">
              <Text style={styles.close}>✕</Text>
            </Pressable>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chips}
          >
            {SECTORS.map((sector) => {
              const active = sector.id === demoSector;
              return (
                <Pressable
                  key={sector.id}
                  onPress={() => setDemoSector(sector.id)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  testID={`demo-sector-${sector.id}`}
                  style={[styles.chip, active && styles.chipActive]}
                >
                  <Text style={styles.chipIcon}>{sector.icon}</Text>
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    {sector.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <Text style={styles.hint}>
            Sells: {SECTORS.find((s) => s.id === demoSector)?.catalogPlural}
          </Text>
        </View>
      ) : (
        <Pressable
          onPress={() => setOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Open demo controls"
          testID="demo-bar-toggle"
          style={styles.pill}
        >
          <View style={styles.dot} />
          <Text style={styles.pillText}>Demo</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(11,18,32,0.94)',
    borderRadius: radius.pill,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: '#33406a',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.accent,
  },
  pillText: {
    color: colors.textInverse,
    fontSize: fontSize.xs,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  panel: {
    width: '100%',
    backgroundColor: 'rgba(11,18,32,0.97)',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#33406a',
    padding: spacing.lg,
  },
  panelHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  panelTitle: {
    color: colors.textInverse,
    fontSize: fontSize.xs,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  close: {
    color: colors.textInverseMuted,
    fontSize: fontSize.md,
    fontWeight: '700',
  },
  chips: {
    gap: spacing.sm,
    paddingRight: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: '#33406a',
    paddingVertical: 7,
    paddingHorizontal: spacing.md,
  },
  chipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  chipIcon: {
    fontSize: fontSize.sm,
  },
  chipText: {
    color: colors.textInverseMuted,
    fontSize: fontSize.xs,
    fontWeight: '700',
  },
  chipTextActive: {
    color: colors.accentInk,
  },
  hint: {
    marginTop: spacing.md,
    color: colors.textInverseMuted,
    fontSize: fontSize.xs,
  },
});
