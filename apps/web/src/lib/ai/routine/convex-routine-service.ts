import { ConvexHttpClient } from "convex/browser"
import { Effect, Layer, Schema } from "effect"

import { api } from "../../../../convex/_generated/api"
import {
  RoutineInfrastructureError,
  RoutineToolExercise,
  RoutineToolView,
  RoutineUnavailable,
} from "./routine-model"
import { RoutineService } from "./routine-service"

type AssistantRoutineExercise = {
  externalId: string
  exerciseExternalId: string
  name: string
  reps?: number
  repRangeMin?: number
  repRangeMax?: number
  restSeconds?: number
  notes?: string
}

type AssistantRoutineView = {
  externalId: string
  name: string
  exercises: Array<AssistantRoutineExercise>
}

export type AssistantRoutineQuery = (
  externalId: string
) => Promise<AssistantRoutineView | null>

export function createConvexAssistantRoutineQuery(
  convexUrl: string
): AssistantRoutineQuery {
  return async (externalId) => {
    const client = new ConvexHttpClient(convexUrl)
    return await client.query(
      api.assistantRoutines.getByExternalId,
      { externalId }
    )
  }
}

function formatRepTarget(exercise: AssistantRoutineExercise) {
  if (exercise.reps !== undefined) {
    return `${exercise.reps} reps`
  }
  if (
    exercise.repRangeMin !== undefined &&
    exercise.repRangeMax !== undefined
  ) {
    return `${exercise.repRangeMin}-${exercise.repRangeMax} reps`
  }
  return undefined
}

function toToolView(routine: AssistantRoutineView) {
  return new RoutineToolView({
    externalId: routine.externalId,
    name: routine.name,
    exercises: routine.exercises.map(
      (exercise) =>
        new RoutineToolExercise({
          externalId: exercise.externalId,
          name: exercise.name,
          repTarget: formatRepTarget(exercise),
          restSeconds: exercise.restSeconds,
          notes: exercise.notes,
        })
    ),
  })
}

export function makeRoutineServiceLayer(query: AssistantRoutineQuery) {
  return Layer.succeed(
    RoutineService,
    RoutineService.of({
      getRoutine: (externalId) =>
        Effect.gen(function* () {
          const routine = yield* Effect.tryPromise({
            try: () => query(externalId),
            catch: (cause) =>
              new RoutineInfrastructureError({
                message: "Routine lookup failed",
                diagnosticCause: cause,
              }),
          })

          if (routine === null) {
            return yield* Effect.fail(new RoutineUnavailable({ externalId }))
          }

          return yield* Effect.try({
            try: () => Schema.decodeUnknownSync(RoutineToolView)(toToolView(routine)),
            catch: (cause) =>
              new RoutineInfrastructureError({
                message: "Routine lookup returned invalid data",
                diagnosticCause: cause,
              }),
          })
        }),
    })
  )
}

export function makeConvexRoutineServiceLayer(convexUrl: string) {
  if (!convexUrl) {
    throw new Error("Convex URL is required for RoutineService")
  }
  return makeRoutineServiceLayer(createConvexAssistantRoutineQuery(convexUrl))
}
