import type { Id } from "./_generated/dataModel"
import type { MutationCtx } from "./_generated/server"
import { MOCK_ROUTINE_SEED } from "../src/lib/db/data/mock-routine-seed"

function makeSetTemplates(previousExamples: string[], unit = "kg") {
  return previousExamples.map((previous) => ({
    previous,
    unit,
  }))
}

async function ensureDefaultExercises(ctx: MutationCtx) {
  const exerciseIdsByExternalId = new Map<string, Id<"exercises">>()
  let created = 0
  let existing = 0

  for (const exercise of MOCK_ROUTINE_SEED.exercises) {
    const found = await ctx.db
      .query("exercises")
      .withIndex("by_external_id", (q) => q.eq("externalId", exercise.id))
      .unique()

    if (found) {
      exerciseIdsByExternalId.set(exercise.id, found._id)
      existing += 1
      continue
    }

    const exerciseId = await ctx.db.insert("exercises", {
      externalId: exercise.id,
      name: exercise.name,
    })
    exerciseIdsByExternalId.set(exercise.id, exerciseId)
    created += 1
  }

  return { exerciseIdsByExternalId, created, existing }
}

export type SeedDatabaseResult = {
  exercises: { created: number; existing: number }
  routine: { routineId: Id<"routines">; created: boolean }
}

export async function seedDatabase(ctx: MutationCtx): Promise<SeedDatabaseResult> {
  const { exerciseIdsByExternalId, created, existing } =
    await ensureDefaultExercises(ctx)

  const existingRoutine = await ctx.db
    .query("routines")
    .withIndex("by_external_id", (q) =>
      q.eq("externalId", MOCK_ROUTINE_SEED.id)
    )
    .unique()

  if (existingRoutine) {
    return {
      exercises: { created, existing },
      routine: { routineId: existingRoutine._id, created: false },
    }
  }

  const routineId = await ctx.db.insert("routines", {
    externalId: MOCK_ROUTINE_SEED.id,
    name: MOCK_ROUTINE_SEED.name,
  })

  for (const [order, exercise] of MOCK_ROUTINE_SEED.exercises.entries()) {
    const exerciseId = exerciseIdsByExternalId.get(exercise.id)
    if (!exerciseId) {
      throw new Error(`Missing exercise registry entry for ${exercise.id}`)
    }

    await ctx.db.insert("routineExercises", {
      routineId,
      exerciseId,
      externalId: exercise.id,
      order,
      reps: exercise.reps,
      restSeconds: exercise.restSeconds,
      notes: exercise.notes,
      setTemplates: makeSetTemplates(
        exercise.previousExamples,
        exercise.unit
      ),
    })
  }

  return {
    exercises: { created, existing },
    routine: { routineId, created: true },
  }
}
