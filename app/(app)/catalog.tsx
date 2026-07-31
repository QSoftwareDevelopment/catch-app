import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/auth/AuthProvider';
import { captureFile, capturePhoto } from '@/catalog/capture';
import { useCatalog } from '@/catalog/CatalogProvider';
import { ACCEPTED_EXTENSIONS, describeSource, sourceIcon } from '@/catalog/sources';
import {
  catalogPlural,
  catalogSingular,
  documentExamples,
  documentPrimary,
  getSector,
} from '@/sectors/sectors';
import { colors, fontSize, radius, spacing } from '@/theme/theme';
import { Button } from '@/ui/Button';
import { FormBanner } from '@/ui/FormBanner';
import { Screen } from '@/ui/Screen';

/**
 * Business context — what the assistant knows about this business.
 *
 * The point of the feature: when a call goes unanswered Catch texts the customer back,
 * and that reply is only worth sending if it knows what the business offers. Everything
 * here feeds that.
 *
 * Named after the trade — "Our Menu Items" for a restaurant, "Our Property Listings" for
 * a realtor — from the sector chosen at signup.
 */
export default function CatalogScreen() {
  const router = useRouter();
  const { business } = useAuth();
  const { sources, addSource, removeSource } = useCatalog();

  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<null | 'photo' | 'file'>(null);

  // Every string on this screen is derived from sector. A plumber is asked for a price
  // sheet, a restaurant for a menu, a realtor for a listing sheet.
  const sector = getSector(business?.sector);
  const plural = catalogPlural(business?.sector);
  const singular = catalogSingular(business?.sector).toLowerCase();
  const lowerPlural = plural.toLowerCase();
  const primaryDoc = documentPrimary(business?.sector);
  const exampleDocs = documentExamples(business?.sector);

  async function handle(kind: 'photo' | 'file') {
    if (busy) return;
    setBusy(kind);
    setError(null);

    const result = kind === 'photo' ? await capturePhoto() : await captureFile();

    // A cancelled picker is a normal action, not a failure — say nothing.
    if (!result.ok) {
      if (!result.cancelled) setError(result.error);
      setBusy(null);
      return;
    }

    addSource(result.source);
    setBusy(null);
  }

  return (
    <Screen scroll testID="catalog-screen">
      <Pressable
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        hitSlop={10}
        style={styles.back}
      >
        <Text style={styles.backText}>‹ Back</Text>
      </Pressable>

      <Text style={styles.title}>Our {plural}</Text>

      {/* --- What this is for --------------------------------------------- */}
      <View style={styles.infoCard}>
        <View style={styles.infoHead}>
          <View style={styles.infoIcon}>
            <Text style={styles.infoIconText}>{sector?.icon ?? '📦'}</Text>
          </View>
          <Text style={styles.infoTitle}>Give your assistant accurate knowledge</Text>
        </View>

        <Text style={styles.infoBody}>
          When you miss a call, Catch texts the customer back. Upload your {exampleDocs} so
          those replies say what you actually offer — not a guess.
        </Text>

        <View style={styles.steps}>
          <Step n={1} label="Scan or upload" />
          <Text style={styles.stepArrow}>→</Text>
          <Step n={2} label="Check it" />
          <Text style={styles.stepArrow}>→</Text>
          <Step n={3} label="Turn it on" />
        </View>
      </View>

      <FormBanner message={error} />

      {/* --- Capture ------------------------------------------------------- */}
      <View style={styles.dropZone}>
        <Text style={styles.dropIcon}>🖼️</Text>
        <Text style={styles.dropTitle}>Scan your {primaryDoc}</Text>
        <Text style={styles.dropHint}>
          For best results, keep the page flat, well lit, and fully in frame.
        </Text>

        <View style={styles.actions}>
          <Button
            label={Platform.OS === 'web' ? 'Choose a photo' : 'Take a photo'}
            onPress={() => handle('photo')}
            loading={busy === 'photo'}
            disabled={busy !== null && busy !== 'photo'}
            testID="catalog-photo"
          />
          <View style={styles.actionRow}>
            <Button
              label="Upload a file"
              variant="secondary"
              onPress={() => handle('file')}
              loading={busy === 'file'}
              disabled={busy !== null && busy !== 'file'}
              style={styles.actionHalf}
              testID="catalog-file"
            />
            <Button
              label="Paste text"
              variant="secondary"
              onPress={() => router.push('/(app)/catalog-paste')}
              disabled={busy !== null}
              style={styles.actionHalf}
              testID="catalog-paste"
            />
          </View>
        </View>

        <Text style={styles.formats}>
          {ACCEPTED_EXTENSIONS.map((e) => e.toUpperCase()).join(' · ')} — up to 10MB each
        </Text>
      </View>

      {/* --- What has been added ------------------------------------------- */}
      {sources.length === 0 ? (
        <Text style={styles.emptyNote}>
          Add your {primaryDoc} so your assistant can answer questions about your{' '}
          {lowerPlural} accurately.
        </Text>
      ) : (
        <View style={styles.list}>
          <Text style={styles.listHeading}>
            {sources.length} {sources.length === 1 ? 'source' : 'sources'} added
          </Text>

          {sources.map((source) => (
            <View key={source.id} style={styles.sourceRow} testID={`source-${source.id}`}>
              <Text style={styles.sourceIcon}>{sourceIcon(source.kind)}</Text>
              <View style={styles.sourceBody}>
                <Text style={styles.sourceName} numberOfLines={1}>
                  {source.name}
                </Text>
                <Text style={styles.sourceMeta}>{describeSource(source)}</Text>
              </View>
              <View style={styles.pending}>
                <Text style={styles.pendingText}>Not read yet</Text>
              </View>
              <Pressable
                onPress={() => removeSource(source.id)}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel={`Remove ${source.name}`}
                testID={`remove-${source.id}`}
              >
                <Text style={styles.remove}>✕</Text>
              </Pressable>
            </View>
          ))}

          {/* Stated plainly rather than implying the upload did something it did not. */}
          <View style={styles.notice}>
            <Text style={styles.noticeText}>
              These are held on this device only. Uploading and reading them needs the
              backend, which is not built yet — nothing here reaches your assistant.
            </Text>
          </View>
        </View>
      )}
    </Screen>
  );
}

function Step({ n, label }: { n: number; label: string }) {
  return (
    <View style={styles.step}>
      <View style={styles.stepBadge}>
        <Text style={styles.stepNum}>{n}</Text>
      </View>
      <Text style={styles.stepLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  back: { alignSelf: 'flex-start', paddingVertical: spacing.sm, marginBottom: spacing.md },
  backText: { fontSize: fontSize.md, fontWeight: '600', color: colors.textMuted },

  title: {
    fontSize: fontSize.display,
    lineHeight: 38,
    fontWeight: '800',
    letterSpacing: -0.8,
    color: colors.text,
    marginBottom: spacing.xl,
  },

  infoCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  infoHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
  },
  infoIconText: { fontSize: 19 },
  infoTitle: {
    flex: 1,
    fontSize: fontSize.md,
    fontWeight: '700',
    letterSpacing: -0.2,
    color: colors.text,
  },
  infoBody: {
    fontSize: fontSize.sm,
    lineHeight: 21,
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
  steps: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  step: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stepBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
  },
  stepNum: { fontSize: 11, fontWeight: '800', color: colors.textMuted },
  stepLabel: { fontSize: fontSize.xs, fontWeight: '700', color: colors.text },
  stepArrow: { fontSize: fontSize.xs, color: colors.borderStrong },

  dropZone: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.borderStrong,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  dropIcon: { fontSize: 28, marginBottom: spacing.md },
  dropTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  dropHint: {
    fontSize: fontSize.sm,
    lineHeight: 20,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  actions: { alignSelf: 'stretch', gap: spacing.md },
  actionRow: { flexDirection: 'row', gap: spacing.md },
  actionHalf: { flex: 1 },
  formats: {
    marginTop: spacing.lg,
    fontSize: fontSize.xs,
    color: colors.textMuted,
    textAlign: 'center',
  },

  emptyNote: {
    fontSize: fontSize.sm,
    lineHeight: 21,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },

  list: { gap: spacing.sm },
  listHeading: {
    fontSize: fontSize.xs,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  sourceIcon: { fontSize: 18 },
  sourceBody: { flex: 1 },
  sourceName: { fontSize: fontSize.sm, fontWeight: '700', color: colors.text },
  sourceMeta: { marginTop: 2, fontSize: fontSize.xs, color: colors.textMuted },
  pending: {
    paddingVertical: 3,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
  },
  pendingText: { fontSize: 10, fontWeight: '700', color: colors.textMuted },
  remove: { fontSize: fontSize.md, color: colors.textMuted, fontWeight: '700' },

  notice: {
    marginTop: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.borderStrong,
    padding: spacing.md,
  },
  noticeText: { fontSize: fontSize.xs, lineHeight: 18, color: colors.textMuted },
});
