import { ConvexError } from "convex/values"

import type { Doc, Id } from "../_generated/dataModel"
import type { MutationCtx, QueryCtx } from "../_generated/server"
import type { UserId } from "./principal"

/**
 * Loads a workout and verifies it belongs to the principal. Foreign or
 * missing workouts are indistinguishable to the caller (NOT_FOUND).
 */
export async function getOwnedWorkout(
  ctx: QueryCtx | MutationCtx,
  userId: UserId,
  workoutId: Id<"workouts">
): Promise<Doc<"workouts">> {
  const workout = await ctx.db.get("workouts", workoutId)
  if (!workout || workout.userId !== userId) {
    throw new ConvexError({
      code: "NOT_FOUND",
      message: "Workout not found",
    })
  }
  return workout
}
