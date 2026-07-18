import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useBlocker } from "@tanstack/react-router";
import { useMutation as useConvexMutation } from "convex/react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { api } from "@workspace/backend/convex/_generated/api";
import { addExerciseToDraft,
  detailToDraft,
  removeExerciseFromDraft,
  updateExerciseInDraft } from "@workspace/domain/routines/domain/map-routine-template";
import {
  addSetToExercise,
  createExerciseDraftFromCatalog,
  isDraftDirty,
  removeSetFromExercise,
  updateExerciseSetTemplate,
  validateDraft,
} from "@workspace/domain/routines/domain/routine-template";
import type {
  ExerciseCatalogItem,
  RoutineDetail,
  RoutineTemplateDraft,
  SetTemplate,
} from "@workspace/domain/routines/domain/types";
import type { RepTargetFields } from "@workspace/domain/lib/rep-target";
import { toast } from "@/components/chat/toast";
import { saveRoutineTemplate } from "@/features/routines/adapters/save-routine-template";
import { routinesQueries } from "@/features/routines/adapters/query-keys";

type UseRoutineEditDraftOptions = {
  detail: RoutineDetail | null;
  externalId: string | undefined;
  isOpen: boolean;
  onClose: () => void;
};

export function useRoutineEditDraft({
  detail,
  externalId,
  isOpen,
  onClose,
}: UseRoutineEditDraftOptions) {
  const queryClient = useQueryClient();
  const updateTemplate = useConvexMutation(api.routines.updateTemplate);

  const baseline = useMemo(
    () => (detail ? detailToDraft(detail) : null),
    [detail]
  );

  const [draft, setDraft] = useState<RoutineTemplateDraft | null>(null);
  const [catalogSearch, setCatalogSearch] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen && baseline) {
      setDraft(structuredClone(baseline));
    }
    if (!isOpen) {
      setDraft(null);
      setCatalogSearch("");
    }
  }, [isOpen, baseline]);

  const catalogQuery = useQuery({
    ...routinesQueries.catalog(catalogSearch || undefined),
    enabled: isOpen,
  });

  const isDirty = draft && baseline ? isDraftDirty(draft, baseline) : false;

  useBlocker({
    shouldBlockFn: () => isOpen && isDirty === true,
    enableBeforeUnload: isOpen && isDirty === true,
    withResolver: true,
  });

  const handleSave = useCallback(async () => {
    if (!draft) return;

    const validationError = validateDraft(draft);
    if (validationError) {
      toast({ type: "error", description: validationError });
      return;
    }

    setIsSaving(true);
    const result = await saveRoutineTemplate(
      (args) => updateTemplate(args),
      draft
    );
    setIsSaving(false);

    if (!result.ok) {
      toast({ type: "error", description: result.message });
      return;
    }

    toast({ type: "success", description: "Routine saved" });
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: routinesQueries.list().queryKey }),
      externalId
        ? queryClient.invalidateQueries({
            queryKey: routinesQueries.detail(externalId).queryKey,
          })
        : Promise.resolve(),
    ]);
    onClose();
  }, [draft, updateTemplate, queryClient, externalId, onClose]);

  const handleCancel = useCallback(() => {
    if (baseline) {
      setDraft(structuredClone(baseline));
    }
    onClose();
  }, [baseline, onClose]);

  const handleNameChange = useCallback((name: string) => {
    setDraft((prev) => (prev ? { ...prev, name } : prev));
  }, []);

  const handleAddExercise = useCallback((item: ExerciseCatalogItem) => {
    setDraft((prev) => {
      if (!prev) return prev;
      const exercise = createExerciseDraftFromCatalog(
        item,
        prev.exercises.length
      );
      return addExerciseToDraft(prev, exercise);
    });
  }, []);

  const handleRemoveExercise = useCallback((index: number) => {
    setDraft((prev) => (prev ? removeExerciseFromDraft(prev, index) : prev));
  }, []);

  const handleExerciseRepTargetChange = useCallback(
    (index: number, value: RepTargetFields) => {
      setDraft((prev) =>
        prev
          ? updateExerciseInDraft(prev, index, (ex) => ({
              ...ex,
              reps: value.reps,
              repRangeMin: value.repRangeMin,
              repRangeMax: value.repRangeMax,
            }))
          : prev
      );
    },
    []
  );

  const handleExerciseRestChange = useCallback(
    (index: number, restSeconds: number | undefined) => {
      setDraft((prev) =>
        prev
          ? updateExerciseInDraft(prev, index, (ex) => ({
              ...ex,
              restSeconds,
            }))
          : prev
      );
    },
    []
  );

  const handleExerciseNotesChange = useCallback(
    (index: number, value: string) => {
      setDraft((prev) =>
        prev
          ? updateExerciseInDraft(prev, index, (ex) => ({ ...ex, notes: value }))
          : prev
      );
    },
    []
  );

  const handleAddSet = useCallback((exerciseIndex: number) => {
    setDraft((prev) =>
      prev
        ? updateExerciseInDraft(prev, exerciseIndex, addSetToExercise)
        : prev
    );
  }, []);

  const handleRemoveSet = useCallback(
    (exerciseIndex: number, setIndex: number) => {
      setDraft((prev) =>
        prev
          ? updateExerciseInDraft(prev, exerciseIndex, (ex) =>
              removeSetFromExercise(ex, setIndex)
            )
          : prev
      );
    },
    []
  );

  const handleSetTemplateChange = useCallback(
    (
      exerciseIndex: number,
      setIndex: number,
      field: keyof SetTemplate,
      value: string
    ) => {
      setDraft((prev) =>
        prev
          ? updateExerciseInDraft(prev, exerciseIndex, (ex) =>
              updateExerciseSetTemplate(ex, setIndex, field, value)
            )
          : prev
      );
    },
    []
  );

  return {
    draft,
    isSaving,
    catalogOptions: catalogQuery.data ?? [],
    catalogLoading: catalogQuery.isLoading,
    catalogSearch,
    setCatalogSearch,
    handleSave,
    handleCancel,
    handleNameChange,
    handleAddExercise,
    handleRemoveExercise,
    handleExerciseRepTargetChange,
    handleExerciseRestChange,
    handleExerciseNotesChange,
    handleAddSet,
    handleRemoveSet,
    handleSetTemplateChange,
  };
}
