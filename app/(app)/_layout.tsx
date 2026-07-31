import { Stack } from 'expo-router';
import React from 'react';

/**
 * Screens that require a session. The root layout is what keeps a signed-out user out of
 * this group; later slices add the real product surfaces here.
 */
export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
    </Stack>
  );
}
