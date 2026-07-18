/**
 * Run: cd packages/domain && bun run test src/routine/store/create-routine-session-store.test.ts
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { LOG_SYNC_DEBOUNCE_MS } from "../sync/workout-session-sync";
import {
  
  createRoutineSessionStore
} from "./create-routine-session-store";
import type {WorkoutSyncRef} from "./create-routine-session-store";
import type { WorkoutMutations } from "../sync/workout-mutations";
import type {
  Exercise,
  ExerciseLogState,
  Routine,
  WorkoutSessionSnapshot,
} from "../domain/types";
import type { Id } from "@workspace/backend/convex/_generated/dataModel";

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
};

const exercises: Array<Exercise> = [
  { id: "ex-1", name: "Bench Press", sets: [], history: [] },
  { id: "ex-2", name: "Overhead Press", sets: [], history: [] },
];

const routine: Routine = {
  id: "routine-1",
  name: "Push Day",
  exercises,
};

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
  };
}

type Deferred<T> = {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason: unknown) => void;
};

function createDeferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function createDeferredMutations() {
  const deferred = {
    updateLog: [] as Array<Deferred<null>>,
    setActiveExercise: [] as Array<Deferred<null>>,
    addSet: [] as Array<Deferred<ExerciseLogState>>,
    removeSet: [] as Array<Deferred<ExerciseLogState>>,
    applyPreviousToSet: [] as Array<Deferred<ExerciseLogState>>,
  };

  const mutations: WorkoutMutations = {
    start: vi.fn(async () => createSessionSnapshot()),
    complete: vi.fn(async () =>
      createSessionSnapshot({ status: "completed", endedAt: 2_000 })
    ),
    updateLog: vi.fn(() => {
      const entry = createDeferred<null>();
      deferred.updateLog.push(entry);
      return entry.promise;
    }),
    setActiveExercise: vi.fn(() => {
      const entry = createDeferred<null>();
      deferred.setActiveExercise.push(entry);
      return entry.promise;
    }),
    addSet: vi.fn(() => {
      const entry = createDeferred<ExerciseLogState>();
      deferred.addSet.push(entry);
      return entry.promise;
    }),
    removeSet: vi.fn(() => {
      const entry = createDeferred<ExerciseLogState>();
      deferred.removeSet.push(entry);
      return entry.promise;
    }),
    applyPreviousToSet: vi.fn(() => {
      const entry = createDeferred<ExerciseLogState>();
      deferred.applyPreviousToSet.push(entry);
      return entry.promise;
    }),
    recordJointPain: vi.fn(async () => "bio-1" as Id<"exerciseBiofeedback">),
  };

  return { mutations, deferred };
}

function createHarness() {
  const { mutations, deferred } = createDeferredMutations();
  const syncRef: WorkoutSyncRef = { current: mutations };
  const onSyncError = vi.fn();
  const store = createRoutineSessionStore(
    routine,
    createSessionSnapshot(),
    syncRef,
    { onSyncError }
  );

  return { store, mutations, deferred, onSyncError };
}

describe("createRoutineSessionStore stopWorkout", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("does not complete the Workout until an in-flight log write resolves", async () => {
    const { store, mutations, deferred } = createHarness();

    store.getState().updateSet("ex-1", 0, "weight", "62");
    await vi.advanceTimersByTimeAsync(LOG_SYNC_DEBOUNCE_MS);
    expect(deferred.updateLog).toHaveLength(1);

    const stopPromise = store.getState().stopWorkout();
    await vi.advanceTimersByTimeAsync(0);
    expect(mutations.complete).not.toHaveBeenCalled();

    deferred.updateLog[0]?.resolve(null);

    await expect(stopPromise).resolves.toBe(true);
    expect(mutations.complete).toHaveBeenCalledTimes(1);
    expect(store.getState().workoutStatus).toBe("completed");
    expect(store.getState().workoutEndedAt).toBe(2_000);
  });

  it("leaves the Workout ongoing and reports failure when an in-flight write rejects", async () => {
    const { store, mutations, deferred, onSyncError } = createHarness();

    store.getState().updateSet("ex-1", 0, "weight", "62");
    await vi.advanceTimersByTimeAsync(LOG_SYNC_DEBOUNCE_MS);
    expect(deferred.updateLog).toHaveLength(1);

    const stopPromise = store.getState().stopWorkout();
    await vi.advanceTimersByTimeAsync(0);

    deferred.updateLog[0]?.reject(new Error("rejected by backend"));

    await expect(stopPromise).resolves.toBe(false);
    expect(mutations.complete).not.toHaveBeenCalled();
    expect(store.getState().workoutStatus).toBe("ongoing");
    expect(store.getState().isStoppingWorkout).toBe(false);
    expect(onSyncError).toHaveBeenCalledWith("Failed to save set changes");
  });

  it("completes the Workout and reports success when nothing is in flight", async () => {
    const { store, mutations } = createHarness();

    await expect(store.getState().stopWorkout()).resolves.toBe(true);
    expect(mutations.complete).toHaveBeenCalledTimes(1);
    expect(store.getState().workoutStatus).toBe("completed");
    expect(store.getState().workoutEndedAt).toBe(2_000);
  });

  it("drains structural set edits before completing", async () => {
    const { store, mutations, deferred } = createHarness();

    store.getState().addSet("ex-1");
    store.getState().deleteSet("ex-2", 0);
    store.getState().applyPrevious("ex-1", 0);
    expect(deferred.addSet).toHaveLength(1);
    expect(deferred.removeSet).toHaveLength(1);
    expect(deferred.applyPreviousToSet).toHaveLength(1);

    const stopPromise = store.getState().stopWorkout();
    await vi.advanceTimersByTimeAsync(0);
    expect(mutations.complete).not.toHaveBeenCalled();

    deferred.addSet[0]?.resolve(exerciseLog);
    deferred.removeSet[0]?.resolve(exerciseLog);
    await vi.advanceTimersByTimeAsync(0);
    expect(mutations.complete).not.toHaveBeenCalled();

    deferred.applyPreviousToSet[0]?.resolve(exerciseLog);

    await expect(stopPromise).resolves.toBe(true);
    expect(mutations.complete).toHaveBeenCalledTimes(1);
    expect(store.getState().workoutStatus).toBe("completed");
  });

  it("drains an in-flight active-exercise write before completing", async () => {
    const { store, mutations, deferred } = createHarness();

    store.getState().selectExercise("ex-2");
    await vi.advanceTimersByTimeAsync(0);
    expect(deferred.setActiveExercise).toHaveLength(1);
    expect(deferred.updateLog).toHaveLength(1);

    deferred.updateLog[0]?.resolve(null);
    const stopPromise = store.getState().stopWorkout();
    await vi.advanceTimersByTimeAsync(0);
    expect(mutations.complete).not.toHaveBeenCalled();

    deferred.setActiveExercise[0]?.resolve(null);

    await expect(stopPromise).resolves.toBe(true);
    expect(mutations.complete).toHaveBeenCalledTimes(1);
    expect(store.getState().workoutStatus).toBe("completed");
  });

  it("leaves the Workout ongoing when a rejected structural edit is in flight", async () => {
    const { store, mutations, deferred } = createHarness();

    store.getState().addSet("ex-1");
    expect(deferred.addSet).toHaveLength(1);

    const stopPromise = store.getState().stopWorkout();
    await vi.advanceTimersByTimeAsync(0);

    deferred.addSet[0]?.reject(new Error("rejected by backend"));

    await expect(stopPromise).resolves.toBe(false);
    expect(mutations.complete).not.toHaveBeenCalled();
    expect(store.getState().workoutStatus).toBe("ongoing");
    expect(store.getState().isStoppingWorkout).toBe(false);
  });
});
