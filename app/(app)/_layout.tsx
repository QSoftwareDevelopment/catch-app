import { Stack } from 'expo-router';
import React from 'react';

import { CatalogProvider } from '@/catalog/CatalogProvider';

/**
 * Screens that require a session. The root layout is what keeps a signed-out user out of
 * this group.
 *
 * CatalogProvider sits here rather than inside the catalog screen so captured sources
 * survive navigating away and back.
 */
export default function AppLayout() {
  return (
    <CatalogProvider>
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="conversations" />
        <Stack.Screen name="catalog" />
        <Stack.Screen name="catalog-paste" options={{ presentation: 'modal' }} />
        <Stack.Screen name="outreach" />
        {/* Settings is presented modally so it reads as stepping outside the main flow
            rather than deeper into it. */}
        <Stack.Screen name="settings" options={{ presentation: 'modal' }} />
      </Stack>
    </CatalogProvider>
  );
}
