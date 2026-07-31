import { Stack } from 'expo-router';
import React from 'react';

/**
 * Screens available to a signed-out visitor. The root layout is what keeps a signed-in
 * user out of this group.
 */
export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="sign-up" />
      <Stack.Screen name="log-in" />
      <Stack.Screen name="check-email" />
      <Stack.Screen name="forgot-password" />
    </Stack>
  );
}
