import type {
  Exercise,
  ExerciseLogState,
  SetEntry,
  SetField,
} from "@/features/routine/domain/types";

export function parsePrevious(
  previous: string
): Pick<SetEntry, "weight" | "unit" | "reps"> | null {
  const match = previous.trim().match(/^([\d.]+)\s*(\w+)?\s*x\s*(.+)$/i);
  if (!match) return null;

  return {
    weight: match[1],
    unit: match[2] || "kg",
    reps: match[3].trim(),
  };
}

export function cloneSets(exercise: Exercise): SetEntry[] {
  return exercise.sets.map((set) => ({ ...set }));
}

export function createInitialLog(exercise: Exercise): ExerciseLogState {
  return {
    sets: cloneSets(exercise),
    completed: false,
  };
}

export function createInitialLogs(
  exercises: Exercise[]
): Record<string, ExerciseLogState> {
  return Object.fromEntries(
    exercises.map((exercise) => [exercise.id, createInitialLog(exercise)])
  );
}

export function updateSetField(
  log: ExerciseLogState,
  setIdx: number,
  field: SetField,
  value: string
): ExerciseLogState {
  return {
    ...log,
    sets: log.sets.map((set, index) =>
      index === setIdx ? { ...set, [field]: value } : set
    ),
  };
}

export function applyPreviousToSet(
  log: ExerciseLogState,
  setIdx: number
): ExerciseLogState {
  const current = log.sets[setIdx];
  const parsed = parsePrevious(current.previous);
  if (!parsed) return log;

  return {
    ...log,
    sets: log.sets.map((set, index) =>
      index === setIdx ? { ...set, ...parsed } : set
    ),
  };
}

export function addSet(log: ExerciseLogState): ExerciseLogState {
  const lastSet = log.sets.at(-1);
  const newSet: SetEntry = {
    previous: lastSet?.previous ?? "",
    weight: "",
    unit: lastSet?.unit ?? "kg",
    reps: "",
    status: "pending",
  };

  return {
    ...log,
    sets: [...log.sets, newSet],
  };
}

export function deleteSet(
  log: ExerciseLogState,
  setIdx: number
): ExerciseLogState {
  if (log.sets.length <= 1) return log;

  return {
    ...log,
    sets: log.sets.filter((_, index) => index !== setIdx),
  };
}

export function canCompleteSet(set: SetEntry): boolean {
  return Boolean(set.weight || set.reps);
}

function markSetsCompleted(sets: SetEntry[]): SetEntry[] {
  return sets.map((set) =>
    set.weight || set.reps ? { ...set, status: "completed" as const } : set
  );
}

export function toggleSetComplete(
  log: ExerciseLogState,
  setIdx: number
): ExerciseLogState {
  const set = log.sets[setIdx];
  if (!set) return log;

  const isCompleted = set.status === "completed";

  if (isCompleted) {
    return {
      ...log,
      completed: false,
      sets: log.sets.map((entry, index) =>
        index === setIdx ? { ...entry, status: "pending" as const } : entry
      ),
    };
  }

  if (!canCompleteSet(set)) return log;

  return {
    ...log,
    sets: log.sets.map((entry, index) =>
      index === setIdx ? { ...entry, status: "completed" as const } : entry
    ),
  };
}

export function toggleExerciseComplete(
  log: ExerciseLogState
): ExerciseLogState {
  const wasCompleted = log.completed;

  if (wasCompleted) {
    return {
      ...log,
      completed: false,
      sets: log.sets.map((set) => ({ ...set, status: "pending" as const })),
    };
  }

  return {
    ...log,
    completed: true,
    sets: markSetsCompleted(log.sets),
  };
}
