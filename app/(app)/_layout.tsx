import { Stack } from 'expo-router';
import React from 'react';

/**
 * Screens that require a session. The root layout is what keeps a signed-out user out of
 * this group.
 */
export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="conversations" />
      <Stack.Screen name="catalog" />
      <Stack.Screen name="outreach" />
      {/* Settings is presented modally so it reads as stepping outside the main flow
          rather than deeper into it. */}
      <Stack.Screen name="settings" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
