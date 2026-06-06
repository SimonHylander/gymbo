import { ConvexError } from "convex/values"

import type { Doc, Id } from "../_generated/dataModel"
import type { MutationCtx, QueryCtx } from "../_generated/server"

export async function getRoutineByExternalId(
  ctx: QueryCtx | MutationCtx,
  externalId: string
): Promise<Doc<"routines">> {
  const routine = await ctx.db
    .query("routines")
    .withIndex("by_external_id", (q) => q.eq("externalId", externalId))
    .unique()

  if (!routine) {
    throw new ConvexError({
      code: "NOT_FOUND",
      message: "Routine not found",
    })
  }

  return routine
}

export async function getOngoingWorkoutForRoutine(
  ctx: QueryCtx | MutationCtx,
  routineId: Id<"routines">
): Promise<Doc<"workouts"> | null> {
  return await ctx.db
    .query("workouts")
    .withIndex("by_routine_and_status", (q) =>
      q.eq("routineId", routineId).eq("status", "ongoing")
    )
    .unique()
}

export async function assertNoOngoingWorkout(
  ctx: QueryCtx | MutationCtx,
  routineId: Id<"routines">
): Promise<void> {
  const ongoing = await getOngoingWorkoutForRoutine(ctx, routineId)
  if (ongoing) {
    throw new ConvexError({
      code: "WORKOUT_ONGOING",
      message: "Finish or leave the workout before editing this routine",
    })
  }
}

export async function buildOngoingRoutineIdSet(
  ctx: QueryCtx,
  routineIds: Id<"routines">[]
): Promise<Set<Id<"routines">>> {
  const ongoingSet = new Set<Id<"routines">>()
  await Promise.all(
    routineIds.map(async (routineId) => {
      const workout = await getOngoingWorkoutForRoutine(ctx, routineId)
      if (workout) {
        ongoingSet.add(routineId)
      }
    })
  )
  return ongoingSet
}

export async function countExercisesForRoutine(
  ctx: QueryCtx,
  routineId: Id<"routines">
): Promise<number> {
  const exercises = await ctx.db
    .query("routineExercises")
    .withIndex("by_routine", (q) => q.eq("routineId", routineId))
    .collect()
  return exercises.length
}
