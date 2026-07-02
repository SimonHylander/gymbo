import { assert, describe, it } from "@effect/vitest"
import { Cause, Effect, Layer, ManagedRuntime, Schema } from "effect"

import { getRoutine } from "./get-routine"
import { gymboRegistry } from "./gymbo-registry"
import {
  RoutineToolExercise,
  RoutineToolView,
  RoutineUnavailable,
} from "./routine-model"
import { RoutineService } from "./routine-service"

const sampleRoutine = new RoutineToolView({
  externalId: "routine_public_1",
  name: "Upper Strength",
  exercises: [
    new RoutineToolExercise({
      externalId: "exercise_public_1",
      name: "Bench Press",
      repTarget: "5 reps",
      restSeconds: 180,
      notes: "Use a controlled eccentric.",
    }),
  ],
})

describe("get_routine", () => {
  it.effect("returns a decoded RoutineToolView for valid input", () =>
    Effect.gen(function* () {
      const result = yield* getRoutine.execute({
        externalId: sampleRoutine.externalId,
      }).pipe(Effect.provide(validRoutineLayer))

      assert.instanceOf(result, RoutineToolView)
      assert.strictEqual(result.externalId, sampleRoutine.externalId)
      assert.strictEqual(result.exercises[0]?.name, "Bench Press")
    })
  )

  it.effect("keeps unavailable failures typed before adapter policy conversion", () =>
    Effect.gen(function* () {
      const exit = yield* getRoutine.execute({ externalId: "missing" }).pipe(
        Effect.provide(unavailableRoutineLayer),
        Effect.exit
      )

      assert.isTrue(exit._tag === "Failure")
      if (exit._tag === "Failure") {
        const reason = exit.cause.reasons.find(Cause.isFailReason)
        assert.isDefined(reason)
        const failure = reason.error
        assert.instanceOf(failure, RoutineUnavailable)
        assert.strictEqual(failure.externalId, "missing")
      }
    })
  )

  it.effect("does not execute the service for invalid input through the registry", () =>
    Effect.gen(function* () {
      let calls = 0
      const layer = Layer.succeed(RoutineService, {
        getRoutine: () =>
          Effect.sync(() => {
            calls += 1
            return sampleRoutine
          }),
      })
      const runtime = ManagedRuntime.make(layer)
      yield* Effect.addFinalizer(() => runtime.disposeEffect)
      const bound = gymboRegistry.bind(runtime)

      const exit = yield* Effect.tryPromise(() =>
        bound.execute("get_routine", {})
      ).pipe(Effect.exit)

      assert.isTrue(exit._tag === "Failure")
      assert.strictEqual(calls, 0)
    })
  )

  it.effect("binds and executes from the registry with a fake Layer", () =>
    Effect.gen(function* () {
      const runtime = ManagedRuntime.make(validRoutineLayer)
      yield* Effect.addFinalizer(() => runtime.disposeEffect)
      const bound = gymboRegistry.bind(runtime)

      const metadata = bound.getAll()
      assert.strictEqual(metadata.length, 1)
      assert.strictEqual(metadata[0]?.name, "get_routine")

      const result = yield* Effect.tryPromise(() =>
        bound.execute("get_routine", { externalId: sampleRoutine.externalId })
      )

      const decoded = yield* Schema.decodeUnknownEffect(RoutineToolView)(result)
      assert.strictEqual(decoded.name, sampleRoutine.name)
    })
  )
})

const validRoutineLayer = Layer.succeed(RoutineService, {
  getRoutine: (externalId) =>
    externalId === sampleRoutine.externalId
      ? Effect.succeed(sampleRoutine)
      : Effect.fail(RoutineUnavailable.make({ externalId })),
})

const unavailableRoutineLayer = Layer.succeed(RoutineService, {
  getRoutine: (externalId) =>
    Effect.fail(RoutineUnavailable.make({ externalId })),
})
