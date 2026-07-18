import type { QueryCtx } from "../_generated/server"
import type { UserId } from "./principal"

export async function getAssistantRoutineByExternalId(
  ctx: QueryCtx,
  userId: UserId,
  externalId: string
) {
  const routine = await ctx.db
    .query("routines")
    .withIndex("by_user_and_external_id", (q) =>
      q.eq("userId", userId).eq("externalId", externalId)
    )
    .unique()

  if (!routine) {
    return null
  }

  const routineExercises = await ctx.db
    .query("routineExercises")
    .withIndex("by_routine", (q) => q.eq("routineId", routine._id))
    .collect()

  const exercises = await Promise.all(
    routineExercises
      .sort((a, b) => a.order - b.order)
      .map(async (routineExercise) => {
        const exercise = await ctx.db.get("exercises", routineExercise.exerciseId)
        if (!exercise) {
          throw new Error(
            `Exercise ${routineExercise.exerciseId} not found for routine exercise ${routineExercise._id}`
          )
        }

        return {
          externalId: routineExercise.externalId,
          exerciseExternalId: exercise.externalId,
          name: exercise.name,
          reps: routineExercise.reps,
          repRangeMin: routineExercise.repRangeMin,
          repRangeMax: routineExercise.repRangeMax,
          restSeconds: routineExercise.restSeconds,
          notes: routineExercise.notes,
        }
      })
  )

  return {
    externalId: routine.externalId,
    name: routine.name,
    exercises,
  }
}
