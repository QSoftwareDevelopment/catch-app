import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { useAuth } from '@/auth/AuthProvider';
import { useCatalog } from '@/catalog/CatalogProvider';
import { validatePastedText } from '@/catalog/sources';
import { documentPrimary, catalogPlural } from '@/sectors/sectors';
import { colors, fontSize, radius, spacing } from '@/theme/theme';
import { Button } from '@/ui/Button';
import { Screen } from '@/ui/Screen';
import { TextField } from '@/ui/TextField';

/**
 * Type or paste business context directly.
 *
 * The path that always works: no camera, no file, no scanning a document that may not
 * exist on paper. Plenty of small businesses only have their prices in their head.
 */
export default function CatalogPasteScreen() {
  const router = useRouter();
  const { business } = useAuth();
  const { addSource } = useCatalog();

  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);

  const primaryDoc = documentPrimary(business?.sector);
  const plural = catalogPlural(business?.sector).toLowerCase();

  function handleSave() {
    const problem = validatePastedText(text);
    setError(problem);
    if (problem) return;

    const trimmed = text.trim();
    addSource({
      kind: 'text',
      // First line makes a better label than a timestamp when scanning the list later.
      name: trimmed.split('\n')[0].slice(0, 60) || 'Pasted text',
      sizeBytes: null,
      mimeType: 'text/plain',
      text: trimmed,
    });
    router.back();
  }

  return (
    <Screen scroll testID="catalog-paste-screen">
      <Pressable
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        hitSlop={10}
        style={styles.back}
      >
        <Text style={styles.backText}>‹ Back</Text>
      </Pressable>

      <Text style={styles.title}>Type it out</Text>
      <Text style={styles.body}>
        No {primaryDoc} to scan? Write your {plural} and prices here. Plain lines are fine —
        one per line reads best.
      </Text>

      <TextField
        label="Your details"
        value={text}
        onChangeText={(next) => {
          setText(next);
          if (error) setError(null);
        }}
        error={error}
        multiline
        numberOfLines={10}
        textAlignVertical="top"
        placeholder={'Furnace tune-up — $149\nAC install — from $3,200\nEmergency call-out — $95'}
        style={styles.input}
        testID="paste-input"
      />

      <Button label="Save" onPress={handleSave} testID="paste-save" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: { alignSelf: 'flex-start', paddingVertical: spacing.sm, marginBottom: spacing.md },
  backText: { fontSize: fontSize.md, fontWeight: '600', color: colors.textMuted },
  title: {
    fontSize: fontSize.xl,
    fontWeight: '800',
    letterSpacing: -0.4,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  body: {
    fontSize: fontSize.sm,
    lineHeight: 21,
    color: colors.textMuted,
    marginBottom: spacing.xl,
  },
  input: {
    minHeight: 200,
    paddingTop: spacing.md,
    borderRadius: radius.md,
  },
});
