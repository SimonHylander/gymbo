import { ConvexError, v } from "convex/values"

import type { Doc, Id } from "./_generated/dataModel"
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server"
import { getRoutineByExternalId } from "./lib/routines"
import { exerciseLog, workoutStatus } from "./validators"

const workoutSessionValidator = v.object({
  workoutId: v.id("workouts"),
  routineExternalId: v.string(),
  status: workoutStatus,
  startedAt: v.union(v.number(), v.null()),
  endedAt: v.union(v.number(), v.null()),
  activeExerciseExternalId: v.string(),
  exerciseLogs: v.record(v.string(), exerciseLog),
  workoutExerciseIds: v.record(v.string(), v.id("workoutExercises")),
})

type WorkoutSession = {
  workoutId: Id<"workouts">
  routineExternalId: string
  status: "pending" | "ongoing" | "completed"
  startedAt: number | null
  endedAt: number | null
  activeExerciseExternalId: string
  exerciseLogs: Record<string, { sets: Doc<"workoutExercises">["log"]["sets"]; completed: boolean }>
  workoutExerciseIds: Record<string, Id<"workoutExercises">>
}

async function loadWorkoutSession(
  ctx: QueryCtx | MutationCtx,
  workout: Doc<"workouts">,
  routineExternalId: string
): Promise<WorkoutSession> {
  const workoutExercises = await ctx.db
    .query("workoutExercises")
    .withIndex("by_workout", (q) => q.eq("workoutId", workout._id))
    .collect()

  const exerciseLogs: WorkoutSession["exerciseLogs"] = {}
  const workoutExerciseIds: WorkoutSession["workoutExerciseIds"] = {}

  for (const workoutExercise of workoutExercises) {
    exerciseLogs[workoutExercise.externalId] = workoutExercise.log
    workoutExerciseIds[workoutExercise.externalId] = workoutExercise._id
  }

  const firstExerciseExternalId =
    workoutExercises.sort((a, b) => a.order - b.order)[0]?.externalId ?? ""

  return {
    workoutId: workout._id,
    routineExternalId,
    status: workout.status,
    startedAt: workout.startedAt ?? null,
    endedAt: workout.endedAt ?? null,
    activeExerciseExternalId:
      workout.activeExerciseExternalId ?? firstExerciseExternalId,
    exerciseLogs,
    workoutExerciseIds,
  }
}

export const getOngoingForRoutine = query({
  args: { routineExternalId: v.string() },
  returns: v.union(workoutSessionValidator, v.null()),
  handler: async (ctx, { routineExternalId }) => {
    const routine = await ctx.db
      .query("routines")
      .withIndex("by_external_id", (q) => q.eq("externalId", routineExternalId))
      .unique()

    if (!routine) {
      return null
    }

    const workout = await ctx.db
      .query("workouts")
      .withIndex("by_routine_and_status", (q) =>
        q.eq("routineId", routine._id).eq("status", "ongoing")
      )
      .unique()

    if (!workout) {
      return null
    }

    return await loadWorkoutSession(ctx, workout, routineExternalId)
  },
})

export const getSession = query({
  args: { workoutId: v.id("workouts") },
  returns: v.union(workoutSessionValidator, v.null()),
  handler: async (ctx, { workoutId }) => {
    const workout = await ctx.db.get("workouts", workoutId)
    if (!workout) {
      return null
    }

    const routine = await ctx.db.get("routines", workout.routineId)
    if (!routine) {
      return null
    }

    return await loadWorkoutSession(ctx, workout, routine.externalId)
  },
})

export const start = mutation({
  args: { routineExternalId: v.string() },
  returns: workoutSessionValidator,
  handler: async (ctx, { routineExternalId }) => {
    const routine = await getRoutineByExternalId(ctx, routineExternalId)

    const existing = await ctx.db
      .query("workouts")
      .withIndex("by_routine_and_status", (q) =>
        q.eq("routineId", routine._id).eq("status", "ongoing")
      )
      .unique()

    if (existing) {
      return await loadWorkoutSession(ctx, existing, routineExternalId)
    }

    const routineExercises = await ctx.db
      .query("routineExercises")
      .withIndex("by_routine", (q) => q.eq("routineId", routine._id))
      .collect()

    const sortedExercises = routineExercises.sort((a, b) => a.order - b.order)
    const firstExerciseExternalId = sortedExercises[0]?.externalId ?? ""

    const workoutId = await ctx.db.insert("workouts", {
      routineId: routine._id,
      name: routine.name,
      status: "ongoing",
      startedAt: Date.now(),
      activeExerciseExternalId: firstExerciseExternalId,
    })

    for (const routineExercise of sortedExercises) {
      await ctx.db.insert("workoutExercises", {
        workoutId,
        exerciseId: routineExercise.exerciseId,
        externalId: routineExercise.externalId,
        order: routineExercise.order,
        reps: routineExercise.reps,
        repRangeMin: routineExercise.repRangeMin,
        repRangeMax: routineExercise.repRangeMax,
        restSeconds: routineExercise.restSeconds,
        notes: routineExercise.notes,
        log: {
          sets: routineExercise.setTemplates.map((template) => ({
            previous: template.previous,
            weight: "",
            unit: template.unit,
            reps: "",
            status: "pending" as const,
          })),
          completed: false,
        },
      })
    }

    const workout = await ctx.db.get("workouts", workoutId)
    if (!workout) {
      throw new ConvexError({
        code: "INTERNAL",
        message: "Failed to create workout",
      })
    }

    return await loadWorkoutSession(ctx, workout, routineExternalId)
  },
})

export const setActiveExercise = mutation({
  args: {
    workoutId: v.id("workouts"),
    exerciseExternalId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const workout = await ctx.db.get("workouts", args.workoutId)
    if (!workout) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Workout not found",
      })
    }

    if (workout.status !== "ongoing") {
      throw new ConvexError({
        code: "INVALID_STATE",
        message: "Workout is not ongoing",
      })
    }

    if (workout.activeExerciseExternalId === args.exerciseExternalId) {
      return null
    }

    await ctx.db.patch("workouts", args.workoutId, {
      activeExerciseExternalId: args.exerciseExternalId,
    })
    return null
  },
})

export const complete = mutation({
  args: { workoutId: v.id("workouts") },
  returns: workoutSessionValidator,
  handler: async (ctx, { workoutId }) => {
    const workout = await ctx.db.get("workouts", workoutId)
    if (!workout) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Workout not found",
      })
    }

    if (workout.status === "completed") {
      const routine = await ctx.db.get("routines", workout.routineId)
      if (!routine) {
        throw new ConvexError({
          code: "NOT_FOUND",
          message: "Routine not found",
        })
      }
      return await loadWorkoutSession(ctx, workout, routine.externalId)
    }

    if (workout.status !== "ongoing") {
      throw new ConvexError({
        code: "INVALID_STATE",
        message: "Workout is not ongoing",
      })
    }

    await ctx.db.patch("workouts", workoutId, {
      status: "completed",
      endedAt: Date.now(),
    })

    const updated = await ctx.db.get("workouts", workoutId)
    if (!updated) {
      throw new ConvexError({
        code: "INTERNAL",
        message: "Failed to complete workout",
      })
    }

    const routine = await ctx.db.get("routines", updated.routineId)
    if (!routine) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Routine not found",
      })
    }

    return await loadWorkoutSession(ctx, updated, routine.externalId)
  },
})
