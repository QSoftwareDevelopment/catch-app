import { Stack } from "expo-router";
import React from "react";

import { CatalogProvider } from "@/catalog/CatalogProvider";
import { ConnectionsProvider } from "@/connections/ConnectionsProvider";
import { ConversationsProvider } from "@/conversations/ConversationsProvider";
import { OutreachProvider } from "@/outreach/OutreachProvider";

/**
 * Screens that require a session. The root layout is what keeps a signed-out user out of
 * this group.
 *
 * The providers sit here rather than inside their screens so captured sources and thread
 * state survive navigating away and back.
 */
export default function AppLayout() {
  return (
    <CatalogProvider>
      <ConversationsProvider>
        <ConnectionsProvider>
          <OutreachProvider>
            <Stack
              screenOptions={{
                headerShown: false,
                animation: "slide_from_right",
              }}
            >
              <Stack.Screen name="index" />
              <Stack.Screen name="conversations" />
              <Stack.Screen name="conversation/[id]" />
              <Stack.Screen name="catalog" />
              <Stack.Screen
                name="catalog-paste"
                options={{ presentation: "modal" }}
              />
              <Stack.Screen name="outreach/index" />
              <Stack.Screen
                name="outreach/new"
                options={{ presentation: "modal" }}
              />
              <Stack.Screen name="outreach/[id]" />
              {/* Settings is presented modally so it reads as stepping outside the main
                flow rather than deeper into it. */}
              <Stack.Screen
                name="settings/index"
                options={{ presentation: "modal" }}
              />
              <Stack.Screen name="settings/number" />
              <Stack.Screen name="settings/connections" />
            </Stack>
          </OutreachProvider>
        </ConnectionsProvider>
      </ConversationsProvider>
    </CatalogProvider>
  );
}
