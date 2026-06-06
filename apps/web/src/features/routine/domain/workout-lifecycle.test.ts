/**
 * Run: cd apps/web && bun run test src/features/routine/domain/workout-lifecycle.test.ts
 */
import { describe, expect, it, vi } from "vitest";
import type { StoreApi } from "zustand";

import type { RoutineSessionStore } from "@/features/routine/store/create-routine-session-store";
import {
  createWorkoutLifecycle,
  shouldConfirmLeave,
} from "@/features/routine/domain/workout-lifecycle";
import type {
  Exercise,
  ExerciseLogState,
  Routine,
} from "@/features/routine/domain/types";
import type { Id } from "../../../../convex/_generated/dataModel";

const exercise: Exercise = {
  id: "ex-1",
  name: "Bench Press",
  sets: [],
  history: [],
};

const emptyRoutine: Routine = {
  id: "routine-1",
  name: "Push Day",
  exercises: [exercise],
};

const routineWithNoExercises: Routine = {
  id: "routine-2",
  name: "Empty",
  exercises: [],
};

type MockStoreActions = {
  startWorkout: ReturnType<typeof vi.fn>;
  stopWorkout: ReturnType<typeof vi.fn>;
  openJointPainCheckIn: ReturnType<typeof vi.fn>;
  closeJointPainCheckIn: ReturnType<typeof vi.fn>;
};

type MockStoreState = Partial<RoutineSessionStore> & MockStoreActions;

function createMockStore(
  initial: Partial<RoutineSessionStore> = {}
): {
  store: StoreApi<RoutineSessionStore>;
  actions: MockStoreActions;
  setState: (partial: Partial<RoutineSessionStore>) => void;
} {
  const actions: MockStoreActions = {
    startWorkout: vi.fn().mockResolvedValue(undefined),
    stopWorkout: vi.fn().mockResolvedValue(undefined),
    openJointPainCheckIn: vi.fn(),
    closeJointPainCheckIn: vi.fn(),
  };

  let state: MockStoreState = {
    routine: emptyRoutine,
    workoutStatus: "pending",
    workoutId: null,
    exerciseLogs: {},
    ...initial,
    ...actions,
  };

  const store = {
    getState: () => state as RoutineSessionStore,
    setState: vi.fn(),
    subscribe: vi.fn(),
    getInitialState: vi.fn(),
  } as StoreApi<RoutineSessionStore>;

  const setState = (partial: Partial<RoutineSessionStore>) => {
    state = { ...state, ...partial, ...actions };
  };

  actions.startWorkout.mockImplementation(async () => {
    setState({
      workoutStatus: "ongoing",
      workoutId: "workout-1" as Id<"workouts">,
    });
  });

  return { store, actions, setState };
}

function createLifecycle(
  store: StoreApi<RoutineSessionStore> | null,
  overrides: {
    navigateAfterFinish?: ReturnType<typeof vi.fn>;
    navigateHome?: ReturnType<typeof vi.fn>;
  } = {}
) {
  const navigateAfterFinish =
    overrides.navigateAfterFinish ?? vi.fn().mockResolvedValue(undefined);
  const navigateHome =
    overrides.navigateHome ?? vi.fn().mockResolvedValue(undefined);

  const lifecycle = createWorkoutLifecycle({
    getStore: () => store,
    navigateAfterFinish,
    navigateHome,
  });

  return { lifecycle, navigateAfterFinish, navigateHome };
}

describe("shouldConfirmLeave", () => {
  it("returns true when workout is ongoing", () => {
    expect(shouldConfirmLeave("ongoing", {})).toBe(true);
  });

  it("returns true when pending with progress", () => {
    const logs: Record<string, ExerciseLogState> = {
      "ex-1": {
        completed: false,
        sets: [
          {
            previous: "",
            weight: "60",
            unit: "kg",
            reps: "",
            status: "pending",
          },
        ],
      },
    };
    expect(shouldConfirmLeave("pending", logs)).toBe(true);
  });

  it("returns false when pending with no progress", () => {
    expect(shouldConfirmLeave("pending", {})).toBe(false);
  });

  it("returns false when completed", () => {
    expect(shouldConfirmLeave("completed", {})).toBe(false);
  });
});

describe("createWorkoutLifecycle", () => {
  it("requestFinish from pending starts workout then opens joint pain wizard", async () => {
    const { store, actions } = createMockStore({
      workoutStatus: "pending",
      workoutId: null,
    });
    const { lifecycle, navigateAfterFinish } = createLifecycle(store);

    await lifecycle.requestFinish();

    expect(actions.startWorkout).toHaveBeenCalledOnce();
    expect(actions.openJointPainCheckIn).toHaveBeenCalledOnce();
    expect(actions.stopWorkout).not.toHaveBeenCalled();
    expect(navigateAfterFinish).not.toHaveBeenCalled();
  });

  it("requestFinish when not ongoing with navigateAfter navigates without joint pain", async () => {
    const { store, actions } = createMockStore({
      workoutStatus: "completed",
    });
    const { lifecycle, navigateAfterFinish } = createLifecycle(store);

    await lifecycle.requestFinish(true);

    expect(actions.openJointPainCheckIn).not.toHaveBeenCalled();
    expect(navigateAfterFinish).toHaveBeenCalledOnce();
  });

  it("requestFinish with empty exercises stops workout without joint pain", async () => {
    const { store, actions } = createMockStore({
      routine: routineWithNoExercises,
      workoutStatus: "ongoing",
      workoutId: "workout-1" as Id<"workouts">,
    });
    const { lifecycle, navigateAfterFinish } = createLifecycle(store);

    await lifecycle.requestFinish();

    expect(actions.stopWorkout).toHaveBeenCalledOnce();
    expect(actions.openJointPainCheckIn).not.toHaveBeenCalled();
    expect(navigateAfterFinish).not.toHaveBeenCalled();
  });

  it("requestFinish with empty exercises and navigateAfter stops then navigates", async () => {
    const { store, actions } = createMockStore({
      routine: routineWithNoExercises,
      workoutStatus: "ongoing",
      workoutId: "workout-1" as Id<"workouts">,
    });
    const { lifecycle, navigateAfterFinish } = createLifecycle(store);

    await lifecycle.requestFinish(true);

    expect(actions.stopWorkout).toHaveBeenCalledOnce();
    expect(navigateAfterFinish).toHaveBeenCalledOnce();
  });

  it("requestFinish with exercises opens joint pain wizard", async () => {
    const { store, actions } = createMockStore({
      workoutStatus: "ongoing",
      workoutId: "workout-1" as Id<"workouts">,
    });
    const { lifecycle } = createLifecycle(store);

    await lifecycle.requestFinish();

    expect(actions.openJointPainCheckIn).toHaveBeenCalledOnce();
    expect(actions.stopWorkout).not.toHaveBeenCalled();
  });

  it("completeJointPainCheckIn after requestFinish(true) stops and navigates", async () => {
    const { store, actions } = createMockStore({
      workoutStatus: "ongoing",
      workoutId: "workout-1" as Id<"workouts">,
    });
    const { lifecycle, navigateAfterFinish } = createLifecycle(store);

    await lifecycle.requestFinish(true);
    await lifecycle.completeJointPainCheckIn();

    expect(actions.closeJointPainCheckIn).toHaveBeenCalledOnce();
    expect(actions.stopWorkout).toHaveBeenCalledOnce();
    expect(navigateAfterFinish).toHaveBeenCalledOnce();
  });

  it("cancelJointPainCheckIn clears navigate flag", async () => {
    const { store, actions } = createMockStore({
      workoutStatus: "ongoing",
      workoutId: "workout-1" as Id<"workouts">,
    });
    const { lifecycle, navigateAfterFinish } = createLifecycle(store);

    await lifecycle.requestFinish(true);
    lifecycle.cancelJointPainCheckIn();
    await lifecycle.completeJointPainCheckIn();

    expect(actions.closeJointPainCheckIn).toHaveBeenCalledTimes(2);
    expect(navigateAfterFinish).not.toHaveBeenCalled();
  });

  it("proceedToNext behaves like requestFinish(true)", async () => {
    const { store, actions } = createMockStore({
      workoutStatus: "ongoing",
      workoutId: "workout-1" as Id<"workouts">,
    });
    const { lifecycle, navigateAfterFinish } = createLifecycle(store);

    await lifecycle.proceedToNext();
    await lifecycle.completeJointPainCheckIn();

    expect(actions.openJointPainCheckIn).toHaveBeenCalledOnce();
    expect(navigateAfterFinish).toHaveBeenCalledOnce();
  });

  it("shouldConfirmLeave reads store state", () => {
    const { store } = createMockStore({
      workoutStatus: "ongoing",
    });
    const { lifecycle } = createLifecycle(store);

    expect(lifecycle.shouldConfirmLeave()).toBe(true);
  });

  it("leaveWorkout navigates home without stopping workout", async () => {
    const { store, actions } = createMockStore({
      workoutStatus: "ongoing",
      workoutId: "workout-1" as Id<"workouts">,
    });
    const { lifecycle, navigateHome } = createLifecycle(store);

    await lifecycle.leaveWorkout();

    expect(navigateHome).toHaveBeenCalledOnce();
    expect(actions.stopWorkout).not.toHaveBeenCalled();
  });

  it("no-ops when store is null", async () => {
    const navigateAfterFinish = vi.fn().mockResolvedValue(undefined);
    const navigateHome = vi.fn().mockResolvedValue(undefined);
    const { lifecycle } = createLifecycle(null, {
      navigateAfterFinish,
      navigateHome,
    });

    await lifecycle.requestFinish();
    await lifecycle.leaveWorkout();

    expect(navigateAfterFinish).not.toHaveBeenCalled();
    expect(navigateHome).toHaveBeenCalledOnce();
    expect(lifecycle.shouldConfirmLeave()).toBe(false);
  });
});
