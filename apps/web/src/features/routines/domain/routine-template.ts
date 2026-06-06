import { validateRepTarget } from "@/lib/rep-target";

import type {
  RoutineExerciseDraft,
  RoutineTemplateDraft,
  SetTemplate,
} from "./types";

export function createEmptySetTemplate(unit = "kg"): SetTemplate {
  return { previous: "", unit };
}

export function addSetToExercise(
  exercise: RoutineExerciseDraft
): RoutineExerciseDraft {
  const lastUnit =
    exercise.setTemplates[exercise.setTemplates.length - 1]?.unit ?? "kg";
  return {
    ...exercise,
    setTemplates: [...exercise.setTemplates, createEmptySetTemplate(lastUnit)],
  };
}

export function removeSetFromExercise(
  exercise: RoutineExerciseDraft,
  setIndex: number
): RoutineExerciseDraft {
  if (exercise.setTemplates.length <= 1) return exercise;
  return {
    ...exercise,
    setTemplates: exercise.setTemplates.filter((_, i) => i !== setIndex),
  };
}

export function updateExerciseSetTemplate(
  exercise: RoutineExerciseDraft,
  setIndex: number,
  field: keyof SetTemplate,
  value: string
): RoutineExerciseDraft {
  return {
    ...exercise,
    setTemplates: exercise.setTemplates.map((set, i) =>
      i === setIndex ? { ...set, [field]: value } : set
    ),
  };
}

export function validateDraft(draft: RoutineTemplateDraft): string | null {
  if (!draft.name.trim()) {
    return "Routine name is required";
  }
  for (const exercise of draft.exercises) {
    if (exercise.setTemplates.length < 1) {
      return "Each exercise must have at least one set";
    }
    const repError = validateRepTarget({
      reps: exercise.reps,
      repRangeMin: exercise.repRangeMin,
      repRangeMax: exercise.repRangeMax,
    });
    if (repError) {
      return repError;
    }
  }
  return null;
}

export function isDraftDirty(
  draft: RoutineTemplateDraft,
  baseline: RoutineTemplateDraft
): boolean {
  return JSON.stringify(draft) !== JSON.stringify(baseline);
}

export function createExerciseDraftFromCatalog(
  item: { externalId: string; name: string },
  order: number
): RoutineExerciseDraft {
  return {
    externalId: crypto.randomUUID(),
    exerciseExternalId: item.externalId,
    name: item.name,
    order,
    setTemplates: [createEmptySetTemplate()],
  };
}
