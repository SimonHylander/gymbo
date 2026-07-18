import type { Routine } from "./types";
import type { ExerciseLogState, WorkoutStatus } from "./types";

/** Subset of routine session store used by workout lifecycle. */
export type WorkoutLifecycleStorePort = {
  routine: Routine;
  workoutStatus: WorkoutStatus;
  exerciseLogs: Record<string, ExerciseLogState>;
  startWorkout: () => Promise<void>;
  stopWorkout: () => Promise<void>;
  openJointPainCheckIn: () => void;
  closeJointPainCheckIn: () => void;
};
