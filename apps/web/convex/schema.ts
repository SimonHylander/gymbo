import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

import {
  exerciseLog,
  jointPainLevel,
  setTemplate,
  workoutStatus,
} from "./validators"

export default defineSchema({
  /** Global exercise registry (catalog entries). */
  exercises: defineTable({
    externalId: v.string(),
    name: v.string(),
    userId: v.optional(v.string()),
  })
    .index("by_external_id", ["externalId"])
    .index("by_user", ["userId"]),

  /** Reusable workout plan / template. */
  routines: defineTable({
    externalId: v.string(),
    name: v.string(),
    userId: v.optional(v.string()),
  })
    .index("by_external_id", ["externalId"])
    .index("by_user", ["userId"]),

  /** Ordered collection of routines (e.g. a training split). */
  programs: defineTable({
    externalId: v.string(),
    name: v.string(),
    userId: v.optional(v.string()),
  })
    .index("by_external_id", ["externalId"])
    .index("by_user", ["userId"]),

  /** One routine slot in a program, with explicit order for next-workout navigation. */
  programRoutines: defineTable({
    programId: v.id("programs"),
    routineId: v.id("routines"),
    order: v.number(),
  })
    .index("by_program", ["programId", "order"])
    .index("by_routine", ["routineId"]),

  /** One exercise slot on a routine template. */
  routineExercises: defineTable({
    routineId: v.id("routines"),
    exerciseId: v.id("exercises"),
    externalId: v.string(),
    order: v.number(),
    reps: v.optional(v.number()),
    repRangeMin: v.optional(v.number()),
    repRangeMax: v.optional(v.number()),
    restSeconds: v.optional(v.number()),
    notes: v.optional(v.string()),
    setTemplates: v.array(setTemplate),
  })
    .index("by_routine", ["routineId", "order"])
    .index("by_external_id", ["externalId"]),

  /**
   * A single workout session started from a routine.
   * Stores session metadata; logged exercise data lives in workoutExercises.
   */
  workouts: defineTable({
    routineId: v.id("routines"),
    userId: v.optional(v.string()),
    externalId: v.optional(v.string()),
    /** Snapshot of routine.name at workout creation. */
    name: v.string(),
    status: workoutStatus,
    /** External id of the exercise currently shown in the UI. */
    activeExerciseExternalId: v.optional(v.string()),
    /** Set when status becomes ongoing. */
    startedAt: v.optional(v.number()),
    /** Set when status becomes completed. */
    endedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_status", ["userId", "status"])
    .index("by_routine", ["routineId"])
    .index("by_routine_and_status", ["routineId", "status"]),

  /**
   * One exercise within a workout, with template fields snapshotted
   * and actual logged sets filled in during the session.
   */
  workoutExercises: defineTable({
    workoutId: v.id("workouts"),
    exerciseId: v.id("exercises"),
    externalId: v.string(),
    order: v.number(),
    reps: v.optional(v.number()),
    repRangeMin: v.optional(v.number()),
    repRangeMax: v.optional(v.number()),
    restSeconds: v.optional(v.number()),
    notes: v.optional(v.string()),
    log: exerciseLog,
  })
    .index("by_workout", ["workoutId", "order"])
    .index("by_exercise", ["exerciseId"]),

  /**
   * Per-exercise biofeedback captured at workout finish (joint pain, etc.).
   * Session-level metrics (soreness, fatigue) will live in a future workoutCheckins table.
   */
  exerciseBiofeedback: defineTable({
    workoutId: v.id("workouts"),
    workoutExerciseId: v.id("workoutExercises"),
    exerciseId: v.id("exercises"),
    userId: v.optional(v.string()),
    jointPainLevel,
    jointRegions: v.optional(v.array(v.string())),
    recordedAt: v.number(),
  })
    .index("by_workout_exercise", ["workoutExerciseId"])
    .index("by_workout", ["workoutId"])
    .index("by_user_and_exercise", ["userId", "exerciseId"]),
})
