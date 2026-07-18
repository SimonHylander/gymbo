/**
 * Run: cd packages/domain && bun run test src/routine/sync/workout-session-sync.test.ts
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  LOG_SYNC_DEBOUNCE_MS,
  createWorkoutSessionSync,
} from "./workout-session-sync"
import type { WorkoutSessionSyncState } from "./workout-session-sync"
import type { WorkoutMutations } from "./workout-mutations"
import type { ExerciseLogState, WorkoutSessionSnapshot } from "../domain/types"
import type { Id } from "@workspace/backend/convex/_generated/dataModel"

const exerciseLog: ExerciseLogState = {
  completed: false,
  sets: [
    {
      previous: "60 kg x 8",
      weight: "60",
      unit: "kg",
      reps: "8",
      status: "pending",
    },
  ],
}

function createSessionSnapshot(
  overrides: Partial<WorkoutSessionSnapshot> = {}
): WorkoutSessionSnapshot {
  return {
    workoutId: "workout-1",
    routineExternalId: "routine-1",
    status: "ongoing",
    startedAt: 1_000,
    endedAt: null,
    activeExerciseExternalId: "ex-1",
    exerciseLogs: { "ex-1": exerciseLog, "ex-2": exerciseLog },
    workoutExerciseIds: { "ex-1": "we-1", "ex-2": "we-2" },
    ...overrides,
  }
}

function createInitialState(
  overrides: Partial<WorkoutSessionSyncState> = {}
): WorkoutSessionSyncState {
  return {
    workoutId: "workout-1" as Id<"workouts">,
    workoutExerciseIds: {
      "ex-1": "we-1" as Id<"workoutExercises">,
      "ex-2": "we-2" as Id<"workoutExercises">,
    },
    workoutStatus: "ongoing",
    workoutStartedAt: 1_000,
    workoutEndedAt: null,
    exerciseLogs: {
      "ex-1": exerciseLog,
      "ex-2": exerciseLog,
    },
    activeExerciseId: "ex-1",
    isStartingWorkout: false,
    isStoppingWorkout: false,
    syncState: "idle",
    ...overrides,
  }
}

function createFakeMutations(
  overrides: Partial<WorkoutMutations> = {}
): WorkoutMutations & {
  calls: {
    updateLog: Array<{
      workoutExerciseId: Id<"workoutExercises">
      log: ExerciseLogState
    }>
    setActiveExercise: Array<{
      workoutId: Id<"workouts">
      exerciseExternalId: string
    }>
    start: Array<{ routineExternalId: string }>
    complete: Array<{ workoutId: Id<"workouts"> }>
    applyPreviousToSet: Array<{
      workoutExerciseId: Id<"workoutExercises">
      setIndex: number
    }>
  }
} {
  const calls = {
    updateLog: [] as Array<{
      workoutExerciseId: Id<"workoutExercises">
      log: ExerciseLogState
    }>,
    setActiveExercise: [] as Array<{
      workoutId: Id<"workouts">
      exerciseExternalId: string
    }>,
    start: [] as Array<{ routineExternalId: string }>,
    complete: [] as Array<{ workoutId: Id<"workouts"> }>,
    applyPreviousToSet: [] as Array<{
      workoutExerciseId: Id<"workoutExercises">
      setIndex: number
    }>,
  }

  return {
    calls,
    start: vi.fn(async (args) => {
      calls.start.push(args)
      return createSessionSnapshot({ status: "ongoing" })
    }),
    complete: vi.fn(async (args) => {
      calls.complete.push(args)
      return createSessionSnapshot({ status: "completed", endedAt: 2_000 })
    }),
    setActiveExercise: vi.fn(async (args) => {
      calls.setActiveExercise.push(args)
      return null
    }),
    updateLog: vi.fn(async (args) => {
      calls.updateLog.push(args)
      return null
    }),
    addSet: vi.fn(async () => exerciseLog),
    removeSet: vi.fn(async () => exerciseLog),
    applyPreviousToSet: vi.fn(async (args) => {
      calls.applyPreviousToSet.push(args)
      return exerciseLog
    }),
    recordJointPain: vi.fn(async () => "bio-1" as Id<"exerciseBiofeedback">),
    ...overrides,
  }
}

function createHarness(
  initialState: WorkoutSessionSyncState,
  mutations: ReturnType<typeof createFakeMutations>
) {
  let state = { ...initialState }

  const sync = createWorkoutSessionSync({
    getState: () => state,
    setState: (partial) => {
      state = { ...state, ...partial }
    },
    getMutations: () => mutations,
    routineExternalId: "routine-1",
    hydrateFromSession: (session) => ({
      workoutId: session.workoutId as Id<"workouts">,
      workoutExerciseIds: Object.fromEntries(
        Object.entries(session.workoutExerciseIds).map(([k, v]) => [
          k,
          v as Id<"workoutExercises">,
        ])
      ),
      workoutStatus: session.status,
      workoutStartedAt: session.startedAt,
      workoutEndedAt: session.endedAt,
      exerciseLogs: session.exerciseLogs,
      activeExerciseId: session.activeExerciseExternalId,
    }),
  })

  return {
    sync,
    getState: () => state,
  }
}

describe("createWorkoutSessionSync", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("debounces persistLog until the delay elapses", async () => {
    const mutations = createFakeMutations()
    const { sync } = createHarness(createInitialState(), mutations)

    sync.persistLog("ex-1", true)
    expect(mutations.calls.updateLog).toHaveLength(0)

    await vi.advanceTimersByTimeAsync(LOG_SYNC_DEBOUNCE_MS - 1)
    expect(mutations.calls.updateLog).toHaveLength(0)

    await vi.advanceTimersByTimeAsync(1)
    expect(mutations.calls.updateLog).toHaveLength(1)
    expect(mutations.calls.updateLog[0]?.workoutExerciseId).toBe("we-1")
  })

  it("resets debounce timer when persistLog is called again", async () => {
    const mutations = createFakeMutations()
    const { sync } = createHarness(createInitialState(), mutations)

    sync.persistLog("ex-1", true)
    await vi.advanceTimersByTimeAsync(200)
    sync.persistLog("ex-1", true)

    await vi.advanceTimersByTimeAsync(200)
    expect(mutations.calls.updateLog).toHaveLength(0)

    await vi.advanceTimersByTimeAsync(LOG_SYNC_DEBOUNCE_MS)
    expect(mutations.calls.updateLog).toHaveLength(1)
  })

  it("onExerciseSwitch flushes previous exercise then persists active exercise", async () => {
    const mutations = createFakeMutations()
    const { sync } = createHarness(createInitialState(), mutations)

    sync.persistLog("ex-1", true)
    sync.onExerciseSwitch("ex-1", "ex-2")

    expect(mutations.calls.updateLog).toHaveLength(1)
    expect(mutations.calls.setActiveExercise).toEqual([
      {
        workoutId: "workout-1",
        exerciseExternalId: "ex-2",
      },
    ])
  })

  it("ensureWorkoutStarted starts once for concurrent callers", async () => {
    const mutations = createFakeMutations()
    const onWorkoutAutoStarted = vi.fn()
    let state = createInitialState({
      workoutId: null,
      workoutExerciseIds: {},
      workoutStatus: "pending",
      workoutStartedAt: null,
    })

    const sync = createWorkoutSessionSync({
      getState: () => state,
      setState: (partial) => {
        state = { ...state, ...partial }
      },
      getMutations: () => mutations,
      routineExternalId: "routine-1",
      hydrateFromSession: (session) => ({
        workoutId: session.workoutId as Id<"workouts">,
        workoutExerciseIds: Object.fromEntries(
          Object.entries(session.workoutExerciseIds).map(([k, v]) => [
            k,
            v as Id<"workoutExercises">,
          ])
        ),
        workoutStatus: session.status,
        workoutStartedAt: session.startedAt,
        workoutEndedAt: session.endedAt,
        exerciseLogs: session.exerciseLogs,
        activeExerciseId: session.activeExerciseExternalId,
      }),
      onWorkoutAutoStarted,
    })

    await Promise.all([
      sync.ensureWorkoutStarted(),
      sync.ensureWorkoutStarted(),
    ])

    expect(mutations.start).toHaveBeenCalledTimes(1)
    expect(onWorkoutAutoStarted).toHaveBeenCalledTimes(1)
    expect(state.workoutStatus).toBe("ongoing")
  })

  it("applyPrevious falls back to log persist when workout is not ongoing", async () => {
    const mutations = createFakeMutations()
    const { sync } = createHarness(
      createInitialState({ workoutStatus: "pending" }),
      mutations
    )

    sync.applyPrevious("ex-1", 0)

    expect(mutations.calls.applyPreviousToSet).toHaveLength(0)

    await vi.advanceTimersByTimeAsync(LOG_SYNC_DEBOUNCE_MS)
    expect(mutations.calls.updateLog).toHaveLength(0)

    sync.flushLog("ex-1")
    expect(mutations.calls.updateLog).toHaveLength(0)
  })

  it("applyPrevious uses server mutation when workout is ongoing", () => {
    const mutations = createFakeMutations()
    const { sync } = createHarness(createInitialState(), mutations)

    sync.applyPrevious("ex-1", 0)

    expect(mutations.calls.applyPreviousToSet).toEqual([
      { workoutExerciseId: "we-1", setIndex: 0 },
    ])
  })

  it("stopWorkout drains in-flight writes then completes the workout", async () => {
    const mutations = createFakeMutations()
    const { sync, getState } = createHarness(createInitialState(), mutations)

    sync.persistLog("ex-1", true)
    await sync.stopWorkout()

    expect(mutations.calls.updateLog).toHaveLength(1)
    expect(mutations.calls.complete).toEqual([{ workoutId: "workout-1" }])
    expect(getState().workoutStatus).toBe("completed")
    expect(getState().isStoppingWorkout).toBe(false)
  })
})
