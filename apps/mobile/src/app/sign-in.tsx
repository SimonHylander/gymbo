import { useAuth, useSignIn } from "@clerk/clerk-expo"
import { useRouter } from "expo-router"
import { useState } from "react"
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native"

const clerkEnabled = Boolean(process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY)

export default function SignInScreen() {
  if (!clerkEnabled) {
    return (
      <View className="flex-1 items-center justify-center p-8">
        <Text className="text-center text-base text-neutral-500">
          Clerk is not configured. Set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in
          apps/mobile/.env.local to enable sign-in. Until then the app uses the
          shared dev account.
        </Text>
      </View>
    )
  }

  return <ClerkSignIn />
}

function ClerkSignIn() {
  const { isSignedIn, signOut } = useAuth()
  const { signIn, setActive, isLoaded } = useSignIn()
  const router = useRouter()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (isSignedIn) {
    return (
      <View className="flex-1 items-center justify-center gap-4 p-8">
        <Text className="text-base text-neutral-700">You are signed in.</Text>
        <Pressable
          className="rounded-xl bg-neutral-900 px-6 py-3"
          onPress={() => void signOut()}
        >
          <Text className="font-semibold text-white">Sign out</Text>
        </Pressable>
      </View>
    )
  }

  const submit = async () => {
    if (!isLoaded || submitting) {
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const attempt = await signIn.create({
        identifier: email.trim(),
        password,
      })
      if (attempt.status === "complete") {
        await setActive({ session: attempt.createdSessionId })
        router.replace("/")
      } else {
        setError(`Additional step required: ${attempt.status}`)
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Sign in failed. Try again."
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1"
    >
      <View className="flex-1 justify-center gap-4 p-8">
        <Text className="text-2xl font-bold text-neutral-900">Sign in</Text>
        <TextInput
          className="rounded-xl border border-neutral-300 px-4 py-3 text-base"
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          className="rounded-xl border border-neutral-300 px-4 py-3 text-base"
          autoComplete="current-password"
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        {error ? <Text className="text-sm text-red-600">{error}</Text> : null}
        <Pressable
          className="items-center rounded-xl bg-neutral-900 px-6 py-3 active:opacity-80"
          disabled={submitting}
          onPress={() => void submit()}
        >
          <Text className="font-semibold text-white">
            {submitting ? "Signing in…" : "Sign in"}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  )
}
