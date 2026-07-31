import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from '@/auth/AuthProvider';
import { colors } from '@/theme/theme';

/**
 * Root layout. Owns the auth wall.
 *
 * Routing is driven by session state rather than by navigation calls at each call site,
 * so there is exactly one place that decides whether a user may be inside the app. A
 * screen cannot forget to check.
 */

function RootNavigator() {
  const { status } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // Do not redirect until the stored session has been read, or a returning user is
    // bounced to the landing screen for a frame on every cold start.
    if (status === 'restoring') return;

    const inAuthGroup = segments[0] === '(auth)';

    if (status === 'signedIn' && inAuthGroup) {
      router.replace('/(app)');
    } else if (status === 'signedOut' && !inAuthGroup) {
      router.replace('/(auth)');
    }
  }, [status, segments, router]);

  if (status === 'restoring') {
    return (
      <View style={styles.splash}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(app)" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="auto" />
        <RootNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.ink,
  },
});
