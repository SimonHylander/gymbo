import { SignIn } from "@clerk/tanstack-react-start"
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/sign-in")({
  component: SignInPage,
})

function SignInPage() {
  if (!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY) {
    return (
      <main className="flex min-h-screen items-center justify-center p-8 text-center">
        <p>
          Clerk is not configured. Set VITE_CLERK_PUBLISHABLE_KEY and
          CLERK_SECRET_KEY in apps/web/.env.local to enable sign-in.
        </p>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen items-center justify-center">
      <SignIn routing="hash" />
    </main>
  )
}
