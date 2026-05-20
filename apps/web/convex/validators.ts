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
