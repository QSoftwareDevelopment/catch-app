import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useConnections } from '@/connections/ConnectionsProvider';
import { areaLabel, formatPhone } from '@/conversations/format';
import { colors, fontSize, radius, spacing } from '@/theme/theme';
import { Button } from '@/ui/Button';
import { Screen } from '@/ui/Screen';
import { TextField } from '@/ui/TextField';

/**
 * The Catch number — the line customers text, and the one that texts them back when a
 * call goes unanswered.
 *
 * Nothing else in the product works without it. Conversations have no source, outreach
 * has nothing to send from, and the missed-call reply that Catch is built around cannot
 * happen.
 */

/** Southern Ontario, where the first customers are. */
const AREA_CODES = ['289', '365', '905', '416', '647', '437', '519', '226', '613'];

export default function NumberScreen() {
  const router = useRouter();
  const { number, claimNumber, releaseNumber, setForwardTo, isDemoData } = useConnections();

  const [areaCode, setAreaCode] = useState(number?.areaCode ?? '289');
  const [forward, setForward] = useState(number?.forwardTo ?? '');

  const active = number?.status === 'active';

  return (
    <Screen scroll testID="number-screen">
      <Pressable onPress={() => router.back()} hitSlop={10} style={styles.back}>
        <Text style={styles.backText}>‹ Back</Text>
      </Pressable>

      <Text style={styles.title}>Catch number</Text>
      <Text style={styles.subtitle}>
        The number your customers text. When you miss a call on your business line, Catch
        texts them back from here.
      </Text>

      {active && number ? (
        <>
          <View style={styles.numberCard}>
            <Text style={styles.numberLabel}>Your number</Text>
            <Text style={styles.number}>{formatPhone(number.e164)}</Text>
            <Text style={styles.numberArea}>{areaLabel(number.e164)}</Text>
          </View>

          <Text style={styles.sectionLabel}>Forward missed calls from</Text>
          <TextField
            label="Your business line"
            value={forward}
            onChangeText={setForward}
            onBlur={() => setForwardTo(forward.trim() || undefined)}
            placeholder="(905) 555-1234"
            keyboardType="phone-pad"
            hint="Calls here that you do not answer trigger the text back."
            testID="number-forward"
          />

          <Button
            label="Release this number"
            variant="ghost"
            onPress={releaseNumber}
            testID="number-release"
          />
        </>
      ) : (
        <>
          <Text style={styles.sectionLabel}>Pick an area code</Text>
          <View style={styles.codes}>
            {AREA_CODES.map((code) => {
              const selected = code === areaCode;
              return (
                <Pressable
                  key={code}
                  onPress={() => setAreaCode(code)}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  testID={`area-${code}`}
                  style={[styles.code, selected && styles.codeSelected]}
                >
                  <Text style={[styles.codeText, selected && styles.codeTextSelected]}>{code}</Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.hint}>
            {/* A local number gets answered; an unfamiliar out-of-area one gets ignored,
                which defeats the whole point of texting back. */}
            Pick the area your customers are in — a local number gets read, an unfamiliar
            one gets ignored.
          </Text>

          <Button
            label="Get this number"
            onPress={() => claimNumber(areaCode)}
            style={styles.claim}
            testID="number-claim"
          />
        </>
      )}

      <View style={styles.notice}>
        <Text style={styles.noticeText}>
          {isDemoData
            ? 'Sample number for the demo. Nothing is provisioned and no line is live.'
            : 'Not connected yet. Provisioning a real number needs the telephony backend, which is not built.'}
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

  numberCard: {
    backgroundColor: colors.ink,
    borderRadius: radius.lg,
    padding: spacing.xl,
    marginBottom: spacing.xl,
  },
  numberLabel: { fontSize: fontSize.xs, color: colors.textInverseMuted, marginBottom: spacing.sm },
  number: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5, color: colors.textInverse },
  numberArea: { marginTop: spacing.xs, fontSize: fontSize.xs, color: colors.textInverseMuted },

  sectionLabel: {
    fontSize: fontSize.xs,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.textMuted,
    marginBottom: spacing.md,
  },

  codes: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  code: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  codeSelected: { backgroundColor: colors.ink, borderColor: colors.ink },
  codeText: { fontSize: fontSize.md, fontWeight: '700', color: colors.textMuted },
  codeTextSelected: { color: colors.textInverse },
  hint: { marginTop: spacing.md, fontSize: fontSize.xs, lineHeight: 18, color: colors.textMuted },
  claim: { marginTop: spacing.xl },

  notice: {
    marginTop: spacing.xl,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.borderStrong,
    padding: spacing.md,
  },
  noticeText: { fontSize: fontSize.xs, lineHeight: 18, color: colors.textMuted, textAlign: 'center' },
});
