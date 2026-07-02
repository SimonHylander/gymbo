import type { Id } from "./_generated/dataModel"
import type { MutationCtx } from "./_generated/server"
import {
  MOCK_DEFAULT_PROGRAM_SEED,
  type MockExerciseSeed,
  type MockRoutineSeed,
} from "../src/lib/db/data/mock-routine-seed"
import { getDevUserId } from "./lib/auth"

function makeSetTemplates(previousExamples: string[], unit = "kg") {
  return previousExamples.map((previous) => ({
    previous,
    unit,
  }))
}

function collectExerciseSeeds(routines: MockRoutineSeed[]): MockExerciseSeed[] {
  const byExternalId = new Map<string, MockExerciseSeed>()
  for (const routine of routines) {
    for (const exercise of routine.exercises) {
      byExternalId.set(exercise.id, exercise)
    }
  }
  return [...byExternalId.values()]
}

async function ensureDefaultExercises(
  ctx: MutationCtx,
  exerciseSeeds: MockExerciseSeed[]
) {
  const exerciseIdsByExternalId = new Map<string, Id<"exercises">>()
  let created = 0
  let existing = 0

  for (const exercise of exerciseSeeds) {
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

async function ensureRoutine(
  ctx: MutationCtx,
  routineSeed: MockRoutineSeed,
  exerciseIdsByExternalId: Map<string, Id<"exercises">>
) {
  const userId = getDevUserId()
  const existingRoutine = await ctx.db
    .query("routines")
    .withIndex("by_user_and_external_id", (q) =>
      q.eq("userId", userId).eq("externalId", routineSeed.id)
    )
    .unique()

  if (existingRoutine) {
    return { routineId: existingRoutine._id, created: false }
  }

  const routineId = await ctx.db.insert("routines", {
    externalId: routineSeed.id,
    name: routineSeed.name,
    userId,
  })

  for (const [order, exercise] of routineSeed.exercises.entries()) {
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
      repRangeMin: exercise.repRangeMin,
      repRangeMax: exercise.repRangeMax,
      restSeconds: exercise.restSeconds,
      notes: exercise.notes,
      setTemplates: makeSetTemplates(
        exercise.previousExamples,
        exercise.unit
      ),
    })
  }

  return { routineId, created: true }
}

async function ensureDefaultProgram(ctx: MutationCtx) {
  const userId = getDevUserId()
  const existingProgram = await ctx.db
    .query("programs")
    .withIndex("by_user_and_external_id", (q) =>
      q.eq("userId", userId).eq("externalId", MOCK_DEFAULT_PROGRAM_SEED.externalId)
    )
    .unique()

  if (existingProgram) {
    return { programId: existingProgram._id, created: false }
  }

  const programId = await ctx.db.insert("programs", {
    externalId: MOCK_DEFAULT_PROGRAM_SEED.externalId,
    name: MOCK_DEFAULT_PROGRAM_SEED.name,
    userId,
  })

  return { programId, created: true }
}

async function ensureProgramMembership(
  ctx: MutationCtx,
  programId: Id<"programs">,
  routineId: Id<"routines">,
  order: number
) {
  const existingMembership = await ctx.db
    .query("programRoutines")
    .withIndex("by_routine", (q) => q.eq("routineId", routineId))
    .unique()

  if (existingMembership) {
    if (
      existingMembership.programId !== programId ||
      existingMembership.order !== order
    ) {
      await ctx.db.patch(existingMembership._id, { programId, order })
    }
    return { created: false }
  }

  await ctx.db.insert("programRoutines", {
    programId,
    routineId,
    order,
  })

  return { created: true }
}

export type SeedDatabaseResult = {
  exercises: { created: number; existing: number }
  program: { programId: Id<"programs">; created: boolean }
  routines: { created: number; existing: number }
  programRoutines: { created: number; existing: number }
}

export async function seedDatabase(ctx: MutationCtx): Promise<SeedDatabaseResult> {
  const exerciseSeeds = collectExerciseSeeds(MOCK_DEFAULT_PROGRAM_SEED.routines)
  const { exerciseIdsByExternalId, created, existing } =
    await ensureDefaultExercises(ctx, exerciseSeeds)

  const program = await ensureDefaultProgram(ctx)

  let routinesCreated = 0
  let routinesExisting = 0
  let programRoutinesCreated = 0
  let programRoutinesExisting = 0

  for (const [order, routineSeed] of MOCK_DEFAULT_PROGRAM_SEED.routines.entries()) {
    const routine = await ensureRoutine(ctx, routineSeed, exerciseIdsByExternalId)
    if (routine.created) {
      routinesCreated += 1
    } else {
      routinesExisting += 1
    }

    const membership = await ensureProgramMembership(
      ctx,
      program.programId,
      routine.routineId,
      order
    )
    if (membership.created) {
      programRoutinesCreated += 1
    } else {
      programRoutinesExisting += 1
    }
  }

  return {
    exercises: { created, existing },
    program,
    routines: { created: routinesCreated, existing: routinesExisting },
    programRoutines: {
      created: programRoutinesCreated,
      existing: programRoutinesExisting,
    },
  }
}
