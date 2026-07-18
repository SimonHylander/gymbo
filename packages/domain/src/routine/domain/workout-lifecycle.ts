import type { StoreApi } from "zustand";

import { hasWorkoutProgress } from "./session-selectors";
import type {
  ExerciseLogState,
  WorkoutStatus,
} from "./types";
import type { WorkoutLifecycleStorePort } from "./workout-lifecycle-store";

export type NextRoutine = {
  externalId: string;
  name: string;
};

export type WorkoutLifecycleDeps = {
  getStore: () => StoreApi<WorkoutLifecycleStorePort> | null;
  navigateAfterFinish: () => Promise<void>;
  navigateHome: () => Promise<void>;
};

export type WorkoutLifecycle = {
  requestFinish: (navigateAfter?: boolean) => Promise<void>;
  completeJointPainCheckIn: () => Promise<void>;
  cancelJointPainCheckIn: () => void;
  proceedToNext: () => Promise<void>;
  shouldConfirmLeave: () => boolean;
  leaveWorkout: () => Promise<void>;
};

export type WorkoutLifecycleContextValue = WorkoutLifecycle & {
  nextRoutine: NextRoutine | null;
};

export function shouldConfirmLeave(
  workoutStatus: WorkoutStatus,
  exerciseLogs: Record<string, ExerciseLogState>
): boolean {
  if (workoutStatus === "ongoing") return true;
  if (workoutStatus === "completed") return false;
  return hasWorkoutProgress(exerciseLogs);
}

export function createWorkoutLifecycle(
  deps: WorkoutLifecycleDeps
): WorkoutLifecycle {
  let navigateAfterJointPain = false;

  const getState = () => deps.getStore()?.getState() ?? null;

  return {
    async requestFinish(navigateAfter = false) {
      const initial = getState();
      if (!initial) return;

      if (initial.workoutStatus !== "ongoing" && navigateAfter) {
        await deps.navigateAfterFinish();
        return;
      }

      const hasExercises = initial.routine.exercises.length > 0;
      let state = initial;

      if (state.workoutStatus === "pending" && hasExercises) {
        await state.startWorkout();
        const nextState = getState();
        if (!nextState) return;
        state = nextState;
      }

      if (!hasExercises) {
        if (state.workoutStatus === "ongoing") {
          await state.stopWorkout();
        }
        if (navigateAfter) {
          await deps.navigateAfterFinish();
        }
        return;
      }

      navigateAfterJointPain = navigateAfter;
      state.openJointPainCheckIn();
    },

    async completeJointPainCheckIn() {
      const state = getState();
      if (!state) return;

      state.closeJointPainCheckIn();
      await state.stopWorkout();

      if (navigateAfterJointPain) {
        navigateAfterJointPain = false;
        await deps.navigateAfterFinish();
      }
    },

    cancelJointPainCheckIn() {
      navigateAfterJointPain = false;
      getState()?.closeJointPainCheckIn();
    },

    async proceedToNext() {
      await this.requestFinish(true);
    },

    shouldConfirmLeave() {
      const state = getState();
      if (!state) return false;
      return shouldConfirmLeave(state.workoutStatus, state.exerciseLogs);
    },

    async leaveWorkout() {
      await deps.navigateHome();
    },
  };
}
