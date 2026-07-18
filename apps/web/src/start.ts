import { clerkMiddleware } from "@clerk/tanstack-react-start/server"
import { createStart } from "@tanstack/react-start"

/**
 * Clerk is optional until keys are configured: without CLERK_SECRET_KEY the
 * middleware is skipped and the backend's dev identity adapter takes over.
 */
export const startInstance = createStart(() => {
  return {
    requestMiddleware: process.env.CLERK_SECRET_KEY ? [clerkMiddleware()] : [],
  }
})
