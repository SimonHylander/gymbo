import { isExerciseComplete } from "./exercise-log";
import type { Exercise, ExerciseLogState, Routine  } from "./types";

export function getExerciseIndex(
  routine: Routine,
  exerciseId: string
): number {
  return routine.exercises.findIndex((exercise) => exercise.id === exerciseId);
}

export function getActiveExercise(
  routine: Routine,
  activeExerciseId: string
): Exercise | undefined {
  return routine.exercises.find((exercise) => exercise.id === activeExerciseId);
}

export function getCompletedIds(
  routine: Routine,
  exerciseLogs: Record<string, ExerciseLogState>
): Set<string> {
  return new Set(
    routine.exercises
      .filter((exercise) => isExerciseComplete(exerciseLogs[exercise.id]))
      .map((exercise) => exercise.id)
  );
}

export function getAllCompleted(
  routine: Routine,
  exerciseLogs: Record<string, ExerciseLogState>
): boolean {
  return getCompletedIds(routine, exerciseLogs).size === routine.exercises.length;
}

export function getNextIncompleteId(
  routine: Routine,
  exerciseLogs: Record<string, ExerciseLogState>
): string | null {
  return (
    routine.exercises.find(
      (exercise) => !isExerciseComplete(exerciseLogs[exercise.id])
    )?.id ?? null
  );
}

export function getSwitchDirection(
  routine: Routine,
  currentIndex: number,
  nextExerciseId: string
): -1 | 0 | 1 {
  const nextIndex = getExerciseIndex(routine, nextExerciseId);
  if (nextIndex > currentIndex) return 1;
  if (nextIndex < currentIndex) return -1;
  return 0;
}

export type WorkoutStats = {
  completedSets: number;
  totalVolumeKg: number;
};

export function getWorkoutStats(
  exerciseLogs: Record<string, ExerciseLogState>
): WorkoutStats {
  let completedSets = 0;
  let totalVolumeKg = 0;

  for (const log of Object.values(exerciseLogs)) {
    for (const set of log.sets) {
      if (set.status !== "completed") continue;

      completedSets += 1;

      const weight = Number.parseFloat(set.weight);
      const reps = Number.parseFloat(set.reps);
      if (Number.isFinite(weight) && Number.isFinite(reps)) {
        totalVolumeKg += weight * reps;
      }
    }
  }

  return { completedSets, totalVolumeKg };
}

export function hasWorkoutProgress(
  exerciseLogs: Record<string, ExerciseLogState>
): boolean {
  for (const log of Object.values(exerciseLogs)) {
    for (const set of log.sets) {
      if (set.status === "completed") return true;
      if (set.weight.trim() || set.reps.trim()) return true;
    }
  }
  return false;
}
