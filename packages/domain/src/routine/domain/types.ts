export type SetStatus = "pending" | "completed";

export type SetEntry = {
  previous: string;
  weight: string;
  unit: string;
  reps: string;
  status: SetStatus;
};

export type ExerciseLogState = {
  sets: SetEntry[];
  completed: boolean;
};

export type HistoryEntry = {
  date: string;
  sets: number;
  reps: string;
  weight: number;
};

export type Exercise = {
  id: string;
  name: string;
  sets: SetEntry[];
  reps?: number;
  repRangeMin?: number;
  repRangeMax?: number;
  restSeconds?: number;
  notes?: string;
  history: HistoryEntry[];
};

export type Routine = {
  id: string;
  name: string;
  exercises: Exercise[];
};

export type UserNote = {
  id: string;
  text: string;
};

export type SetField = keyof Pick<SetEntry, "reps" | "weight" | "unit">;

export type WorkoutStatus = "pending" | "ongoing" | "completed";

/** Convex workout session metadata (not part of the routine template). */
export type WorkoutSessionSnapshot = {
  workoutId: string;
  routineExternalId: string;
  status: WorkoutStatus;
  startedAt: number | null;
  endedAt: number | null;
  activeExerciseExternalId: string;
  exerciseLogs: Record<string, ExerciseLogState>;
  workoutExerciseIds: Record<string, string>;
};

export type RoutineLoaderData = {
  routine: Routine;
  ongoingSession: WorkoutSessionSnapshot | null;
  nextRoutine: { externalId: string; name: string } | null;
};
