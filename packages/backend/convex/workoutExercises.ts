import { ConvexError, v } from "convex/values"

import type { Doc, Id } from "./_generated/dataModel"
import { mutation, type MutationCtx } from "./_generated/server"
import { parsePrevious } from "./lib/parsePrevious"
import { requireUser, type UserId } from "./lib/principal"
import { exerciseLog } from "./validators"

async function getOngoingWorkoutExercise(
  ctx: MutationCtx,
  userId: UserId,
  workoutExerciseId: Id<"workoutExercises">
): Promise<{ workoutExercise: Doc<"workoutExercises">; workout: Doc<"workouts"> }> {
  const workoutExercise = await ctx.db.get("workoutExercises", workoutExerciseId)
  if (!workoutExercise) {
    throw new ConvexError({
      code: "NOT_FOUND",
      message: "Workout exercise not found",
    })
  }

  const workout = await ctx.db.get("workouts", workoutExercise.workoutId)
  if (!workout || workout.userId !== userId) {
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

  return { workoutExercise, workout }
}

export const updateLog = mutation({
  args: {
    workoutExerciseId: v.id("workoutExercises"),
    log: exerciseLog,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx)
    const { workoutExercise } = await getOngoingWorkoutExercise(
      ctx,
      userId,
      args.workoutExerciseId
    )

    if (
      workoutExercise.log.completed === args.log.completed &&
      JSON.stringify(workoutExercise.log.sets) === JSON.stringify(args.log.sets)
    ) {
      return null
    }

    await ctx.db.patch("workoutExercises", args.workoutExerciseId, {
      log: args.log,
    })
    return null
  },
})

export const addSet = mutation({
  args: {
    workoutExerciseId: v.id("workoutExercises"),
  },
  returns: exerciseLog,
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx)
    const { workoutExercise } = await getOngoingWorkoutExercise(
      ctx,
      userId,
      args.workoutExerciseId
    )

    const lastSet = workoutExercise.log.sets.at(-1)
    const newSet = {
      previous: lastSet?.previous ?? "",
      weight: "",
      unit: lastSet?.unit ?? "kg",
      reps: "",
      status: "pending" as const,
    }

    const log = {
      ...workoutExercise.log,
      sets: [...workoutExercise.log.sets, newSet],
    }

    await ctx.db.patch("workoutExercises", args.workoutExerciseId, { log })
    return log
  },
})

export const removeSet = mutation({
  args: {
    workoutExerciseId: v.id("workoutExercises"),
    setIndex: v.number(),
  },
  returns: exerciseLog,
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx)
    const { workoutExercise } = await getOngoingWorkoutExercise(
      ctx,
      userId,
      args.workoutExerciseId
    )

    if (workoutExercise.log.sets.length <= 1) {
      return workoutExercise.log
    }

    const log = {
      ...workoutExercise.log,
      sets: workoutExercise.log.sets.filter((_, index) => index !== args.setIndex),
    }

    await ctx.db.patch("workoutExercises", args.workoutExerciseId, { log })
    return log
  },
})

export const applyPreviousToSet = mutation({
  args: {
    workoutExerciseId: v.id("workoutExercises"),
    setIndex: v.number(),
  },
  returns: exerciseLog,
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx)
    const { workoutExercise } = await getOngoingWorkoutExercise(
      ctx,
      userId,
      args.workoutExerciseId
    )

    const current = workoutExercise.log.sets[args.setIndex]
    if (!current) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Set not found",
      })
    }

    const parsed = parsePrevious(current.previous)
    if (!parsed) {
      return workoutExercise.log
    }

    const log = {
      ...workoutExercise.log,
      sets: workoutExercise.log.sets.map((set, index) =>
        index === args.setIndex ? { ...set, ...parsed } : set
      ),
    }

    await ctx.db.patch("workoutExercises", args.workoutExerciseId, { log })
    return log
  },
})
