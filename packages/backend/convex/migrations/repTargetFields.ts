import { v } from "convex/values"

import { internalMutation } from "../_generated/server"
import type { MutationCtx } from "../_generated/server"
import { parseLegacyRepTarget } from "../lib/repTarget"

/**
 * One-time migration: convert legacy string `reps` (e.g. "10-12") to
 * numeric reps or repRangeMin/Max. Idempotent — safe to re-run.
 */
export async function migrateLegacyRepTargetsInCtx(ctx: MutationCtx) {
  let routineExercisesUpdated = 0
  let workoutExercisesUpdated = 0

  const routineExercises = await ctx.db.query("routineExercises").collect()
  for (const row of routineExercises) {
    if (typeof row.reps !== "string") {
      continue
    }
    const parsed = parseLegacyRepTarget(row.reps)
    await ctx.db.patch("routineExercises", row._id, {
      reps: parsed.reps,
      repRangeMin: parsed.repRangeMin,
      repRangeMax: parsed.repRangeMax,
    })
    routineExercisesUpdated += 1
  }

  const workoutExercises = await ctx.db.query("workoutExercises").collect()
  for (const row of workoutExercises) {
    if (typeof row.reps !== "string") {
      continue
    }
    const parsed = parseLegacyRepTarget(row.reps)
    await ctx.db.patch("workoutExercises", row._id, {
      reps: parsed.reps,
      repRangeMin: parsed.repRangeMin,
      repRangeMax: parsed.repRangeMax,
    })
    workoutExercisesUpdated += 1
  }

  return { routineExercisesUpdated, workoutExercisesUpdated }
}

export const migrateRepsStringToNumber = internalMutation({
  args: {},
  returns: v.object({
    routineExercisesUpdated: v.number(),
    workoutExercisesUpdated: v.number(),
  }),
  handler: async (ctx) => migrateLegacyRepTargetsInCtx(ctx),
})
