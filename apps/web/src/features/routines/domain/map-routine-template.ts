import type {
  RoutineDetail,
  RoutineExerciseDraft,
  RoutineTemplateDraft,
  UpdateTemplateArgs,
} from "./types";

/** Map getByExternalId response to edit draft (setTemplates from sets). */
export function detailToDraft(detail: RoutineDetail): RoutineTemplateDraft {
  return {
    externalId: detail.id,
    name: detail.name,
    exercises: detail.exercises.map((exercise, order) => ({
      externalId: exercise.id,
      exerciseExternalId: exercise.exerciseExternalId,
      name: exercise.name,
      order,
      reps: exercise.reps,
      repRangeMin: exercise.repRangeMin,
      repRangeMax: exercise.repRangeMax,
      restSeconds: exercise.restSeconds,
      notes: exercise.notes,
      setTemplates: exercise.sets.map((set) => ({
        previous: set.previous,
        unit: set.unit,
      })),
    })),
  };
}

/** Map edit draft to updateTemplate mutation args. */
export function draftToUpdateArgs(
  draft: RoutineTemplateDraft
): UpdateTemplateArgs {
  return {
    externalId: draft.externalId,
    name: draft.name.trim(),
    exercises: draft.exercises.map((exercise, index) => ({
      externalId: exercise.externalId,
      exerciseExternalId: exercise.exerciseExternalId,
      order: index,
      reps: exercise.reps,
      repRangeMin: exercise.repRangeMin,
      repRangeMax: exercise.repRangeMax,
      restSeconds: exercise.restSeconds,
      notes: exercise.notes,
      setTemplates: exercise.setTemplates,
    })),
  };
}

export function updateExerciseInDraft(
  draft: RoutineTemplateDraft,
  index: number,
  updater: (exercise: RoutineExerciseDraft) => RoutineExerciseDraft
): RoutineTemplateDraft {
  return {
    ...draft,
    exercises: draft.exercises.map((ex, i) =>
      i === index ? updater(ex) : ex
    ),
  };
}

export function removeExerciseFromDraft(
  draft: RoutineTemplateDraft,
  index: number
): RoutineTemplateDraft {
  return {
    ...draft,
    exercises: draft.exercises
      .filter((_, i) => i !== index)
      .map((ex, order) => ({ ...ex, order })),
  };
}

export function addExerciseToDraft(
  draft: RoutineTemplateDraft,
  exercise: RoutineExerciseDraft
): RoutineTemplateDraft {
  return {
    ...draft,
    exercises: [
      ...draft.exercises,
      { ...exercise, order: draft.exercises.length },
    ],
  };
}
