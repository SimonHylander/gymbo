import { v } from "convex/values"

import { mutation, query } from "./_generated/server"
import {
  applyRoutineTemplateUpdate,
  getRoutineDetailByExternalId,
} from "./lib/routineTemplate"
import {
  assertNoOngoingWorkout,
  getRoutineByExternalId,
} from "./lib/routines"
import { routineTemplateExerciseValidator } from "./validators"

const nextRoutineValidator = v.union(
  v.object({
    externalId: v.string(),
    name: v.string(),
  }),
  v.null()
)

const exerciseResponseValidator = v.object({
  id: v.string(),
  exerciseExternalId: v.string(),
  name: v.string(),
  reps: v.optional(v.number()),
  repRangeMin: v.optional(v.number()),
  repRangeMax: v.optional(v.number()),
  restSeconds: v.optional(v.number()),
  notes: v.optional(v.string()),
  sets: v.array(
    v.object({
      previous: v.string(),
      weight: v.string(),
      unit: v.string(),
      reps: v.string(),
      status: v.union(v.literal("pending"), v.literal("completed")),
    })
  ),
  history: v.array(
    v.object({
      date: v.string(),
      sets: v.number(),
      reps: v.string(),
      weight: v.number(),
    })
  ),
})

export const getByExternalId = query({
  args: { externalId: v.string() },
  returns: v.union(
    v.object({
      id: v.string(),
      name: v.string(),
      exercises: v.array(exerciseResponseValidator),
      nextRoutine: nextRoutineValidator,
    }),
    v.null()
  ),
  handler: async (ctx, { externalId }) => {
    return await getRoutineDetailByExternalId(ctx, externalId)
  },
})

export const updateTemplate = mutation({
  args: {
    externalId: v.string(),
    name: v.string(),
    exercises: v.array(routineTemplateExerciseValidator),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const routine = await getRoutineByExternalId(ctx, args.externalId)
    await assertNoOngoingWorkout(ctx, routine._id)
    await applyRoutineTemplateUpdate(ctx, routine, {
      name: args.name,
      exercises: args.exercises,
    })
    return null
  },
})
