import { v } from "convex/values"

/** Per-set status while logging a workout. */
export const setStatus = v.union(
  v.literal("pending"),
  v.literal("completed")
)

/** Logged set values during an active or completed workout. */
export const setEntry = v.object({
  previous: v.string(),
  weight: v.string(),
  unit: v.string(),
  reps: v.string(),
  status: setStatus,
})

/** Default set shape on a routine template (no reps/weight yet). */
export const setTemplate = v.object({
  previous: v.string(),
  unit: v.string(),
})

/** Lifecycle of a workout session. */
export const workoutStatus = v.union(
  v.literal("pending"),
  v.literal("ongoing"),
  v.literal("completed")
)

/** Per-exercise log state inside a workout (mirrors client ExerciseLogState). */
export const exerciseLog = v.object({
  sets: v.array(setEntry),
  completed: v.boolean(),
})

/** Aggregated history row for analytics / “previous” hints. */
export const historyEntry = v.object({
  date: v.string(),
  sets: v.number(),
  reps: v.string(),
  weight: v.number(),
})

/** Per-exercise joint pain rating (0 = none, 4 = severe). */
export const jointPainLevel = v.union(
  v.literal(0),
  v.literal(1),
  v.literal(2),
  v.literal(3),
  v.literal(4)
)

/** Routine list page summary item. */
export const routineListItemValidator = v.object({
  externalId: v.string(),
  name: v.string(),
  exerciseCount: v.number(),
  hasOngoingWorkout: v.boolean(),
})

/** Program with nested routine summaries. */
export const programWithRoutinesValidator = v.object({
  externalId: v.string(),
  name: v.string(),
  routines: v.array(routineListItemValidator),
})

/** programs.listWithRoutines return shape. */
export const listWithRoutinesReturnsValidator = v.object({
  programs: v.array(programWithRoutinesValidator),
  unassignedRoutines: v.array(routineListItemValidator),
})

/** Exercise catalog item for picker. */
export const exerciseCatalogItemValidator = v.object({
  externalId: v.string(),
  name: v.string(),
})

/** Optional rep target fields shared by template exercises. */
export const repTargetFieldsValidator = {
  reps: v.optional(v.number()),
  repRangeMin: v.optional(v.number()),
  repRangeMax: v.optional(v.number()),
}

/** One exercise slot in updateTemplate payload. */
export const routineTemplateExerciseValidator = v.object({
  externalId: v.string(),
  exerciseExternalId: v.string(),
  order: v.number(),
  ...repTargetFieldsValidator,
  restSeconds: v.optional(v.number()),
  notes: v.optional(v.string()),
  setTemplates: v.array(setTemplate),
})

export const assistantRoutineExerciseValidator = v.object({
  externalId: v.string(),
  exerciseExternalId: v.string(),
  name: v.string(),
  reps: v.optional(v.number()),
  repRangeMin: v.optional(v.number()),
  repRangeMax: v.optional(v.number()),
  restSeconds: v.optional(v.number()),
  notes: v.optional(v.string()),
})

export const assistantRoutineValidator = v.object({
  externalId: v.string(),
  name: v.string(),
  exercises: v.array(assistantRoutineExerciseValidator),
})
