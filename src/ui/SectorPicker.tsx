import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { SECTORS, type SectorId } from '@/sectors/sectors';
import { colors, fontSize, radius, spacing } from '@/theme/theme';

type Props = {
  value: SectorId | null;
  onChange: (sector: SectorId) => void;
  error?: string | null;
};

/**
 * Sector selection during signup.
 *
 * A list of tappable cards rather than a dropdown. There are only eight options, this is
 * the single most consequential choice in signup — it determines the feature set and the
 * price — and a native picker hides the options behind a tap on both platforms.
 */
export function SectorPicker({ value, onChange, error }: Props) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>What kind of business do you run?</Text>
      <Text style={styles.caption}>This decides which Catch features you get.</Text>

      <View
        accessibilityRole="radiogroup"
        accessibilityLabel="Business sector"
        style={styles.list}
      >
        {SECTORS.map((sector) => {
          const selected = sector.id === value;
          return (
            <Pressable
              key={sector.id}
              testID={`sector-${sector.id}`}
              onPress={() => onChange(sector.id)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={`${sector.label}. ${sector.blurb}`}
              style={({ pressed }) => [
                styles.card,
                selected && styles.cardSelected,
                pressed && styles.cardPressed,
              ]}
            >
              <Text style={styles.icon}>{sector.icon}</Text>
              <View style={styles.cardText}>
                <Text style={[styles.cardLabel, selected && styles.cardLabelSelected]}>
                  {sector.label}
                </Text>
                <Text style={styles.cardBlurb} numberOfLines={2}>
                  {sector.blurb}
                </Text>
              </View>
              {/* A checkmark rather than colour alone, so the selection is not invisible
                  to colour-blind users. */}
              {selected ? <Text style={styles.check}>✓</Text> : null}
            </Pressable>
          );
        })}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  caption: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  list: {
    gap: spacing.sm,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    minHeight: 60,
  },
  cardSelected: {
    borderColor: colors.accent,
    borderWidth: 2,
    backgroundColor: '#F2FDF8',
  },
  cardPressed: {
    opacity: 0.85,
  },
  icon: {
    fontSize: 22,
  },
  cardText: {
    flex: 1,
  },
  cardLabel: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.text,
  },
  cardLabelSelected: {
    color: colors.text,
  },
  cardBlurb: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  check: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.accentPressed,
  },
  error: {
    marginTop: spacing.sm,
    fontSize: fontSize.sm,
    color: colors.danger,
  },
});
