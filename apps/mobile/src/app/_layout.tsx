import "../global.css"

import { ClerkProvider, useAuth } from "@clerk/clerk-expo"
import { tokenCache } from "@clerk/clerk-expo/token-cache"
import { ConvexProvider, ConvexReactClient } from "convex/react"
import { ConvexProviderWithClerk } from "convex/react-clerk"
import { Stack } from "expo-router"
import { StatusBar } from "expo-status-bar"

const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL
const clerkPublishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY

if (!convexUrl) {
  throw new Error("Missing EXPO_PUBLIC_CONVEX_URL — set it in apps/mobile/.env.local")
}

const convex = new ConvexReactClient(convexUrl, {
  unsavedChangesWarning: false,
})

/**
 * Same convention as the web app: with a Clerk publishable key the app runs
 * real auth; without one it talks to the backend's dev identity adapter.
 */
function Providers({ children }: { children: React.ReactNode }) {
  if (clerkPublishableKey) {
    return (
      <ClerkProvider publishableKey={clerkPublishableKey} tokenCache={tokenCache}>
        <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
          {children}
        </ConvexProviderWithClerk>
      </ClerkProvider>
    )
  }
  return <ConvexProvider client={convex}>{children}</ConvexProvider>
}

export default function RootLayout() {
  return (
    <Providers>
      <StatusBar style="auto" />
      <Stack>
        <Stack.Screen name="index" options={{ title: "Routines" }} />
        <Stack.Screen name="sign-in" options={{ title: "Sign in" }} />
      </Stack>
    </Providers>
  )
}
