import { ConvexError } from "convex/values"

import {
  buildOngoingRoutineIdSet,
  countExercisesForRoutine,
} from "./routines"
import {
  
  resolveNextRoutineMembership
} from "./programNavigation"
import { validateRepTarget } from "./repTarget"
import type {ProgramMembership} from "./programNavigation";
import type { MutationCtx, QueryCtx } from "../_generated/server"
import type { Doc, Id } from "../_generated/dataModel"
import type { UserId } from "./principal"

export type RoutineListItem = {
  externalId: string
  name: string
  exerciseCount: number
  hasOngoingWorkout: boolean
}

export type ListWithRoutinesResult = {
  programs: Array<{
    externalId: string
    name: string
    routines: Array<RoutineListItem>
  }>
  unassignedRoutines: Array<RoutineListItem>
}

export type TemplateExercisePayload = {
  externalId: string
  exerciseExternalId: string
  order: number
  reps?: number
  repRangeMin?: number
  repRangeMax?: number
  restSeconds?: number
  notes?: string
  setTemplates: Array<{ previous: string; unit: string }>
}

export type TemplateUpdatePayload = {
  name: string
  exercises: Array<TemplateExercisePayload>
}

export function validateTemplatePayload(payload: TemplateUpdatePayload): void {
  const trimmedName = payload.name.trim()
  if (!trimmedName) {
    throw new ConvexError({
      code: "VALIDATION_ERROR",
      message: "Routine name is required",
    })
  }

  const orders = new Set<number>()
  const externalIds = new Set<string>()

  for (const exercise of payload.exercises) {
    if (orders.has(exercise.order)) {
      throw new ConvexError({
        code: "VALIDATION_ERROR",
        message: "Duplicate exercise order values",
      })
    }
    orders.add(exercise.order)

    if (externalIds.has(exercise.externalId)) {
      throw new ConvexError({
        code: "VALIDATION_ERROR",
        message: "Duplicate exercise external IDs",
      })
    }
    externalIds.add(exercise.externalId)

    if (exercise.setTemplates.length < 1) {
      throw new ConvexError({
        code: "VALIDATION_ERROR",
        message: "Each exercise must have at least one set template",
      })
    }

    const repTargetError = validateRepTarget({
      reps: exercise.reps,
      repRangeMin: exercise.repRangeMin,
      repRangeMax: exercise.repRangeMax,
    })
    if (repTargetError) {
      throw new ConvexError({
        code: "VALIDATION_ERROR",
        message: repTargetError,
      })
    }
  }
}

export function toExerciseResponse(
  routineExercise: Doc<"routineExercises">,
  exercise: Doc<"exercises">
) {
  return {
    id: routineExercise.externalId,
    exerciseExternalId: exercise.externalId,
    name: exercise.name,
    reps: routineExercise.reps,
    repRangeMin: routineExercise.repRangeMin,
    repRangeMax: routineExercise.repRangeMax,
    restSeconds: routineExercise.restSeconds,
    notes: routineExercise.notes,
    sets: routineExercise.setTemplates.map((template) => ({
      previous: template.previous,
      weight: "",
      unit: template.unit,
      reps: "",
      status: "pending" as const,
    })),
    history: [] as Array<{
      date: string
      sets: number
      reps: string
      weight: number
    }>,
  }
}

export async function loadRoutineExercisesWithNames(
  ctx: QueryCtx,
  routineId: Id<"routines">
) {
  const routineExercises = await ctx.db
    .query("routineExercises")
    .withIndex("by_routine", (q) => q.eq("routineId", routineId))
    .collect()

  return await Promise.all(
    routineExercises.map(async (routineExercise) => {
      const exercise = await ctx.db.get("exercises", routineExercise.exerciseId)
      if (!exercise) {
        throw new Error(
          `Exercise ${routineExercise.exerciseId} not found for routine exercise ${routineExercise._id}`
        )
      }
      return toExerciseResponse(routineExercise, exercise)
    })
  )
}

async function resolveNextRoutineForRoutine(
  ctx: QueryCtx,
  routineId: Id<"routines">
) {
  const currentMembership = await ctx.db
    .query("programRoutines")
    .withIndex("by_routine", (q) => q.eq("routineId", routineId))
    .unique()

  if (!currentMembership) {
    return null
  }

  const programMemberships = await ctx.db
    .query("programRoutines")
    .withIndex("by_program", (q) =>
      q.eq("programId", currentMembership.programId)
    )
    .collect()

  const memberships: Array<ProgramMembership> = []
  for (const membership of programMemberships) {
    const memberRoutine = await ctx.db.get("routines", membership.routineId)
    if (!memberRoutine) {
      continue
    }

    memberships.push({
      order: membership.order,
      routine: {
        externalId: memberRoutine.externalId,
        name: memberRoutine.name,
      },
    })
  }

  return resolveNextRoutineMembership(currentMembership.order, memberships)
}

export async function getRoutineDetailByExternalId(
  ctx: QueryCtx,
  userId: UserId,
  externalId: string
) {
  const routine = await ctx.db
    .query("routines")
    .withIndex("by_user_and_external_id", (q) =>
      q.eq("userId", userId).eq("externalId", externalId)
    )
    .unique()

  if (!routine) {
    return null
  }

  const exercises = await loadRoutineExercisesWithNames(ctx, routine._id)
  const nextRoutine = await resolveNextRoutineForRoutine(ctx, routine._id)

  return {
    id: routine.externalId,
    name: routine.name,
    exercises,
    nextRoutine,
  }
}

async function buildRoutineListItem(
  ctx: QueryCtx,
  routine: Doc<"routines">,
  ongoingSet: Set<Id<"routines">>
): Promise<RoutineListItem> {
  const exerciseCount = await countExercisesForRoutine(ctx, routine._id)
  return {
    externalId: routine.externalId,
    name: routine.name,
    exerciseCount,
    hasOngoingWorkout: ongoingSet.has(routine._id),
  }
}

export async function buildListWithRoutines(
  ctx: QueryCtx,
  userId: UserId
): Promise<ListWithRoutinesResult> {
  const programs = await ctx.db
    .query("programs")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect()
  const assignedRoutineIds = new Set<Id<"routines">>()

  const programResults = await Promise.all(
    programs.map(async (program) => {
      const memberships = await ctx.db
        .query("programRoutines")
        .withIndex("by_program", (q) => q.eq("programId", program._id))
        .collect()

      const sorted = memberships.sort((a, b) => a.order - b.order)
      const routineIds = sorted.map((m) => m.routineId)
      for (const id of routineIds) {
        assignedRoutineIds.add(id)
      }

      const ongoingSet = await buildOngoingRoutineIdSet(ctx, routineIds)

      const routines = await Promise.all(
        sorted.map(async (membership) => {
          const routine = await ctx.db.get("routines", membership.routineId)
          if (!routine) {
            return null
          }
          return buildRoutineListItem(ctx, routine, ongoingSet)
        })
      )

      return {
        externalId: program.externalId,
        name: program.name,
        routines: routines.filter((r): r is RoutineListItem => r !== null),
      }
    })
  )

  const allRoutines = await ctx.db
    .query("routines")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect()
  const unassigned = allRoutines.filter((r) => !assignedRoutineIds.has(r._id))
  const unassignedIds = unassigned.map((r) => r._id)
  const unassignedOngoingSet = await buildOngoingRoutineIdSet(ctx, unassignedIds)

  const unassignedRoutines = await Promise.all(
    unassigned.map((routine) =>
      buildRoutineListItem(ctx, routine, unassignedOngoingSet)
    )
  )

  return {
    programs: programResults,
    unassignedRoutines,
  }
}

async function ensureExercise(
  ctx: MutationCtx,
  exerciseExternalId: string,
  name: string
): Promise<Id<"exercises">> {
  const existing = await ctx.db
    .query("exercises")
    .withIndex("by_external_id", (q) => q.eq("externalId", exerciseExternalId))
    .unique()

  if (existing) {
    return existing._id
  }

  return await ctx.db.insert("exercises", {
    externalId: exerciseExternalId,
    name,
  })
}

export async function applyRoutineTemplateUpdate(
  ctx: MutationCtx,
  routine: Doc<"routines">,
  payload: TemplateUpdatePayload
): Promise<void> {
  validateTemplatePayload(payload)

  await ctx.db.patch("routines", routine._id, { name: payload.name.trim() })

  const existingExercises = await ctx.db
    .query("routineExercises")
    .withIndex("by_routine", (q) => q.eq("routineId", routine._id))
    .collect()

  const payloadExternalIds = new Set(payload.exercises.map((e) => e.externalId))
  const existingByExternalId = new Map(
    existingExercises.map((e) => [e.externalId, e])
  )

  const toDelete = existingExercises.filter(
    (e) => !payloadExternalIds.has(e.externalId)
  )
  await Promise.all(
    toDelete.map((e) => ctx.db.delete("routineExercises", e._id))
  )

  for (const exercisePayload of payload.exercises) {
    const catalogExercise = await ctx.db
      .query("exercises")
      .withIndex("by_external_id", (q) =>
        q.eq("externalId", exercisePayload.exerciseExternalId)
      )
      .unique()

    const exerciseId = catalogExercise
      ? catalogExercise._id
      : await ensureExercise(
          ctx,
          exercisePayload.exerciseExternalId,
          exercisePayload.exerciseExternalId
        )

    const existing = existingByExternalId.get(exercisePayload.externalId)

    if (existing) {
      await ctx.db.patch("routineExercises", existing._id, {
        exerciseId,
        order: exercisePayload.order,
        reps: exercisePayload.reps,
        repRangeMin: exercisePayload.repRangeMin,
        repRangeMax: exercisePayload.repRangeMax,
        restSeconds: exercisePayload.restSeconds,
        notes: exercisePayload.notes,
        setTemplates: exercisePayload.setTemplates,
      })
    } else {
      await ctx.db.insert("routineExercises", {
        routineId: routine._id,
        exerciseId,
        externalId: exercisePayload.externalId,
        order: exercisePayload.order,
        reps: exercisePayload.reps,
        repRangeMin: exercisePayload.repRangeMin,
        repRangeMax: exercisePayload.repRangeMax,
        restSeconds: exercisePayload.restSeconds,
        notes: exercisePayload.notes,
        setTemplates: exercisePayload.setTemplates,
      })
    }
  }
}
