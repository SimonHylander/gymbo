import { v } from "convex/values"

import {  internalMutation } from "../_generated/server"
import { DEV_USER_ID } from "../lib/devIdentity"
import type {MutationCtx} from "../_generated/server";

/**
 * Claims pre-principal rows (created before workouts/exerciseBiofeedback
 * stamped userId) for the dev principal. Idempotent; runs from init so dev
 * deployments self-heal after the auth seam landed.
 */
export async function backfillWorkoutOwnershipInCtx(ctx: MutationCtx) {
  const workouts = await ctx.db.query("workouts").collect()
  const unownedWorkouts = workouts.filter((row) => row.userId === undefined)
  for (const workout of unownedWorkouts) {
    await ctx.db.patch("workouts", workout._id, { userId: DEV_USER_ID })
  }

  const biofeedback = await ctx.db.query("exerciseBiofeedback").collect()
  const unownedBiofeedback = biofeedback.filter(
    (row) => row.userId === undefined
  )
  for (const row of unownedBiofeedback) {
    await ctx.db.patch("exerciseBiofeedback", row._id, { userId: DEV_USER_ID })
  }

  return {
    patchedWorkouts: unownedWorkouts.length,
    patchedBiofeedback: unownedBiofeedback.length,
  }
}

export const backfillDevOwnership = internalMutation({
  args: {},
  returns: v.object({
    patchedWorkouts: v.number(),
    patchedBiofeedback: v.number(),
  }),
  handler: async (ctx) => backfillWorkoutOwnershipInCtx(ctx),
})
