import type { Id } from "../../../../convex/_generated/dataModel";
import type {
  ExerciseLogState,
  WorkoutSessionSnapshot,
} from "@/features/routine/domain/types";

export type WorkoutMutations = {
  start: (args: { routineExternalId: string }) => Promise<WorkoutSessionSnapshot>;
  complete: (args: { workoutId: Id<"workouts"> }) => Promise<WorkoutSessionSnapshot>;
  setActiveExercise: (args: {
    workoutId: Id<"workouts">;
    exerciseExternalId: string;
  }) => Promise<null>;
  updateLog: (args: {
    workoutExerciseId: Id<"workoutExercises">;
    log: ExerciseLogState;
  }) => Promise<null>;
  addSet: (args: {
    workoutExerciseId: Id<"workoutExercises">;
  }) => Promise<ExerciseLogState>;
  removeSet: (args: {
    workoutExerciseId: Id<"workoutExercises">;
    setIndex: number;
  }) => Promise<ExerciseLogState>;
  applyPreviousToSet: (args: {
    workoutExerciseId: Id<"workoutExercises">;
    setIndex: number;
  }) => Promise<ExerciseLogState>;
};

export function toWorkoutSessionSnapshot(
  session: {
    workoutId: Id<"workouts">;
    routineExternalId: string;
    status: "pending" | "ongoing" | "completed";
    startedAt: number | null;
    endedAt: number | null;
    activeExerciseExternalId: string;
    exerciseLogs: Record<string, ExerciseLogState>;
    workoutExerciseIds: Record<string, Id<"workoutExercises">>;
  },
): WorkoutSessionSnapshot {
  return {
    workoutId: session.workoutId,
    routineExternalId: session.routineExternalId,
    status: session.status,
    startedAt: session.startedAt,
    endedAt: session.endedAt,
    activeExerciseExternalId: session.activeExerciseExternalId,
    exerciseLogs: session.exerciseLogs,
    workoutExerciseIds: Object.fromEntries(
      Object.entries(session.workoutExerciseIds).map(([k, v]) => [k, v as string]),
    ),
  };
}

export function createWorkoutSync(
  mutations: {
    startMutation: (args: { routineExternalId: string }) => Promise<unknown>;
    completeMutation: (args: { workoutId: Id<"workouts"> }) => Promise<unknown>;
    setActiveExerciseMutation: (args: {
      workoutId: Id<"workouts">;
      exerciseExternalId: string;
    }) => Promise<unknown>;
    updateLogMutation: (args: {
      workoutExerciseId: Id<"workoutExercises">;
      log: ExerciseLogState;
    }) => Promise<unknown>;
    addSetMutation: (args: {
      workoutExerciseId: Id<"workoutExercises">;
    }) => Promise<unknown>;
    removeSetMutation: (args: {
      workoutExerciseId: Id<"workoutExercises">;
      setIndex: number;
    }) => Promise<unknown>;
    applyPreviousToSetMutation: (args: {
      workoutExerciseId: Id<"workoutExercises">;
      setIndex: number;
    }) => Promise<unknown>;
  },
): WorkoutMutations {
  return {
    start: async (args) =>
      toWorkoutSessionSnapshot(
        (await mutations.startMutation(args)) as Parameters<
          typeof toWorkoutSessionSnapshot
        >[0],
      ),
    complete: async (args) =>
      toWorkoutSessionSnapshot(
        (await mutations.completeMutation(args)) as Parameters<
          typeof toWorkoutSessionSnapshot
        >[0],
      ),
    setActiveExercise: async (args) => {
      await mutations.setActiveExerciseMutation(args);
      return null;
    },
    updateLog: async (args) => {
      await mutations.updateLogMutation(args);
      return null;
    },
    addSet: async (args) =>
      (await mutations.addSetMutation(args)) as ExerciseLogState,
    removeSet: async (args) =>
      (await mutations.removeSetMutation(args)) as ExerciseLogState,
    applyPreviousToSet: async (args) =>
      (await mutations.applyPreviousToSetMutation(args)) as ExerciseLogState,
  };
}
