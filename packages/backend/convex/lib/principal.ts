import { ConvexError } from "convex/values"

import { DEV_USER_ID } from "./devIdentity"
import type { Auth } from "convex/server"

export type UserId = string

type PrincipalCtx = { auth: Auth }

/**
 * Principal resolution seam. Every Convex function attributes data to the
 * user id returned here — identity never comes from client-supplied args.
 *
 * Two adapters, selected by the deployment env var AUTH_PROVIDER (a
 * server-owned switch, never client input):
 *
 * - "clerk": a verified identity from `ctx.auth` is required; unauthenticated
 *   calls are rejected. Set AUTH_PROVIDER=clerk on deployments serving real
 *   users.
 * - "dev": a verified or test-injected identity is honored when present,
 *   otherwise the "dev" principal is used so local dev, seed scripts, and
 *   function tests run without tokens.
 *
 * The switch is fail-closed: any other value — including unset — raises at
 * resolution rather than falling back, so a misconfigured deployment refuses
 * requests instead of silently attributing everyone's data to one Principal.
 * See docs/architecture/ai-web-boundary.md, "Identity And Principal".
 */
async function clerkIdentity(ctx: PrincipalCtx): Promise<UserId | null> {
  const identity = await ctx.auth.getUserIdentity()
  return identity?.subject ?? null
}

async function devIdentity(ctx: PrincipalCtx): Promise<UserId | null> {
  return (await clerkIdentity(ctx)) ?? DEV_USER_ID
}

export async function requireUser(ctx: PrincipalCtx): Promise<UserId> {
  const provider = process.env.AUTH_PROVIDER
  if (provider !== "clerk" && provider !== "dev") {
    throw new Error(
      `AUTH_PROVIDER must be "dev" or "clerk", got ${
        provider === undefined ? "unset" : JSON.stringify(provider)
      }. Set it on the deployment: bunx convex env set AUTH_PROVIDER dev`
    )
  }
  const resolve = provider === "clerk" ? clerkIdentity : devIdentity
  const userId = await resolve(ctx)

  if (userId === null) {
    throw new ConvexError({
      code: "UNAUTHENTICATED",
      message: "Sign in required",
    })
  }

  return userId
}
