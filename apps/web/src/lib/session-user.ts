import { useUser } from "@clerk/tanstack-react-start"

import { MOCK_USER  } from "./mock-auth"
import type {MockUser} from "./mock-auth";

const clerkEnabled = Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY)

/**
 * The signed-in Clerk user mapped to the app's user shape. Falls back to the
 * dev user when Clerk is not configured or nobody is signed in — mirroring
 * the backend's dev identity adapter (see packages/backend convex/lib/principal.ts).
 */
export const useSessionUser: () => MockUser = clerkEnabled
  ? function useClerkSessionUser() {
      const { user } = useUser()
      if (!user) {
        return MOCK_USER
      }
      return {
        id: user.id,
        email: user.primaryEmailAddress?.emailAddress ?? "",
        name: user.fullName ?? user.username ?? "Signed in",
      }
    }
  : () => MOCK_USER
