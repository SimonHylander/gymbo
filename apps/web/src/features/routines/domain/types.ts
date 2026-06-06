/** List page summary item (from programs.listWithRoutines). */
export type RoutineSummary = {
  externalId: string;
  name: string;
  exerciseCount: number;
  hasOngoingWorkout: boolean;
};

export type RoutineListProgram = {
  externalId: string;
  name: string;
  routines: RoutineSummary[];
};

export type RoutinesListData = {
  programs: RoutineListProgram[];
  unassignedRoutines: RoutineSummary[];
};

export type SetTemplate = {
  previous: string;
  unit: string;
};

/** Edit draft for a single exercise slot on a routine template. */
export type RoutineExerciseDraft = {
  externalId: string;
  exerciseExternalId: string;
  name: string;
  order: number;
  reps?: number;
  repRangeMin?: number;
  repRangeMax?: number;
  restSeconds?: number;
  notes?: string;
  setTemplates: SetTemplate[];
};

/** Full routine template edit draft. */
export type RoutineTemplateDraft = {
  externalId: string;
  name: string;
  exercises: RoutineExerciseDraft[];
};

/** Detail response shape from routines.getByExternalId (subset used on list page). */
export type RoutineDetailExercise = {
  id: string;
  exerciseExternalId: string;
  name: string;
  reps?: number;
  repRangeMin?: number;
  repRangeMax?: number;
  restSeconds?: number;
  notes?: string;
  sets: Array<{
    previous: string;
    weight: string;
    unit: string;
    reps: string;
    status: "pending" | "completed";
  }>;
};

export type RoutineDetail = {
  id: string;
  name: string;
  exercises: RoutineDetailExercise[];
  nextRoutine: { externalId: string; name: string } | null;
};

export type ExerciseCatalogItem = {
  externalId: string;
  name: string;
};

export type UpdateTemplateArgs = {
  externalId: string;
  name: string;
  exercises: Array<{
    externalId: string;
    exerciseExternalId: string;
    order: number;
    reps?: number;
    repRangeMin?: number;
    repRangeMax?: number;
    restSeconds?: number;
    notes?: string;
    setTemplates: SetTemplate[];
  }>;
};

export type ConvexErrorCode =
  | "NOT_FOUND"
  | "WORKOUT_ONGOING"
  | "VALIDATION_ERROR";
