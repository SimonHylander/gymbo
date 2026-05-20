import { v } from "convex/values"

import { query } from "./_generated/server"
import type { Doc } from "./_generated/dataModel"

export const getByExternalId = query({
  args: { externalId: v.string() },
  handler: async (ctx, { externalId }) => {
    const routine = await ctx.db
      .query("routines")
      .withIndex("by_external_id", (q) => q.eq("externalId", externalId))
      .unique()

    if (!routine) {
      return null
    }

    const routineExercises = await ctx.db
      .query("routineExercises")
      .withIndex("by_routine", (q) => q.eq("routineId", routine._id))
      .collect()

    const exercisesWithHistory = await Promise.all(
      routineExercises.map(async (routineExercise) => {
        const exercise = await ctx.db.get(routineExercise.exerciseId)
        if (!exercise) {
          throw new Error(
            `Exercise ${routineExercise.exerciseId} not found for routine exercise ${routineExercise._id}`
          )
        }

        return toExerciseResponse(routineExercise, exercise)
      })
    )

    return {
      id: routine.externalId,
      name: routine.name,
      exercises: exercisesWithHistory,
    }
  },
})

function toExerciseResponse(
  routineExercise: Doc<"routineExercises">,
  exercise: Doc<"exercises">
) {
  return {
    id: routineExercise.externalId,
    name: exercise.name,
    reps: routineExercise.reps,
    restSeconds: routineExercise.restSeconds,
    notes: routineExercise.notes,
    sets: routineExercise.setTemplates.map((template) => ({
      previous: template.previous,
      weight: "",
      unit: template.unit,
      reps: "",
      status: "pending" as const,
    })),
    /** Populated from completed workouts once workout queries exist. */
    history: [] as Array<{
      date: string
      sets: number
      reps: string
      weight: number
    }>,
  }
}
