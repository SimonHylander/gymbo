import { ConvexError, v } from "convex/values"

import {  mutation, query } from "./_generated/server"
import { getOwnedWorkout } from "./lib/ownership"
import {  requireUser } from "./lib/principal"
import { jointPainLevel } from "./validators"
import type {UserId} from "./lib/principal";
import type {MutationCtx} from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel"

const exerciseBiofeedbackDoc = v.object({
  _id: v.id("exerciseBiofeedback"),
  _creationTime: v.number(),
  workoutId: v.id("workouts"),
  workoutExerciseId: v.id("workoutExercises"),
  exerciseId: v.id("exercises"),
  userId: v.optional(v.string()),
  jointPainLevel,
  jointRegions: v.optional(v.array(v.string())),
  recordedAt: v.number(),
})

async function getWorkoutExerciseForFeedback(
  ctx: MutationCtx,
  userId: UserId,
  workoutId: Id<"workouts">,
  workoutExerciseId: Id<"workoutExercises">
): Promise<{ workout: Doc<"workouts">; workoutExercise: Doc<"workoutExercises"> }> {
  const workout = await getOwnedWorkout(ctx, userId, workoutId)

  if (workout.status !== "ongoing" && workout.status !== "completed") {
    throw new ConvexError({
      code: "INVALID_STATE",
      message: "Workout is not active",
    })
  }

  const workoutExercise = await ctx.db.get("workoutExercises", workoutExerciseId)
  if (!workoutExercise) {
    throw new ConvexError({
      code: "NOT_FOUND",
      message: "Workout exercise not found",
    })
  }

  if (workoutExercise.workoutId !== workoutId) {
    throw new ConvexError({
      code: "INVALID_ARGUMENT",
      message: "Workout exercise does not belong to this workout",
    })
  }

  return { workout, workoutExercise }
}

export const recordJointPain = mutation({
  args: {
    workoutId: v.id("workouts"),
    workoutExerciseId: v.id("workoutExercises"),
    jointPainLevel,
    jointRegions: v.optional(v.array(v.string())),
  },
  returns: v.id("exerciseBiofeedback"),
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx)
    const { workoutExercise } = await getWorkoutExerciseForFeedback(
      ctx,
      userId,
      args.workoutId,
      args.workoutExerciseId
    )

    const existing = await ctx.db
      .query("exerciseBiofeedback")
      .withIndex("by_workout_exercise", (q) =>
        q.eq("workoutExerciseId", args.workoutExerciseId)
      )
      .unique()

    const recordedAt = Date.now()

    if (existing) {
      if (
        existing.jointPainLevel === args.jointPainLevel &&
        JSON.stringify(existing.jointRegions ?? []) ===
          JSON.stringify(args.jointRegions ?? [])
      ) {
        return existing._id
      }

      await ctx.db.patch("exerciseBiofeedback", existing._id, {
        jointPainLevel: args.jointPainLevel,
        jointRegions: args.jointRegions,
        recordedAt,
        userId,
      })
      return existing._id
    }

    return await ctx.db.insert("exerciseBiofeedback", {
      workoutId: args.workoutId,
      workoutExerciseId: args.workoutExerciseId,
      exerciseId: workoutExercise.exerciseId,
      userId,
      jointPainLevel: args.jointPainLevel,
      jointRegions: args.jointRegions,
      recordedAt,
    })
  },
})

export const listByWorkout = query({
  args: { workoutId: v.id("workouts") },
  returns: v.array(exerciseBiofeedbackDoc),
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx)
    await getOwnedWorkout(ctx, userId, args.workoutId)

    return await ctx.db
      .query("exerciseBiofeedback")
      .withIndex("by_workout", (q) => q.eq("workoutId", args.workoutId))
      .collect()
  },
})
