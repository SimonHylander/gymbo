import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { WorkoutMutations } from "@workspace/domain/routine/sync/workout-mutations";
import type { JointPainLevel } from "@workspace/domain/routine/domain/joint-pain";
import {
  createJointPainSessionState,
  prefillSavedLevels,
  reduceJointPainSession,
  selectJointPainViewModel,
  type ExistingJointPainFeedback,
  type JointPainSessionConfig,
  type JointPainSessionEvent,
} from "@workspace/domain/routine/domain/joint-pain-session";
import type { Exercise } from "@workspace/domain/routine/domain/types";
import type { Id } from "@workspace/backend/convex/_generated/dataModel";
import { toast } from "@/components/chat/toast";

type UseJointPainSessionOptions = {
  open: boolean;
  targetExerciseId: string | null;
  workoutId: Id<"workouts"> | null;
  exercises: Exercise[];
  workoutExerciseIds: Record<string, Id<"workoutExercises">>;
  existingFeedback: ExistingJointPainFeedback[] | undefined;
  recordJointPain: WorkoutMutations["recordJointPain"];
  onComplete: () => Promise<void>;
  onSingleExerciseSaved: (exerciseId: string) => void;
};

export function useJointPainSession({
  open,
  targetExerciseId,
  workoutId,
  exercises,
  workoutExerciseIds,
  existingFeedback,
  recordJointPain,
  onComplete,
  onSingleExerciseSaved,
}: UseJointPainSessionOptions) {
  const [state, setState] = useState(createJointPainSessionState);
  const stateRef = useRef(state);
  stateRef.current = state;

  const prevOpenRef = useRef(open);
  const prevFeedbackRef = useRef(existingFeedback);

  const dispatch = useCallback((event: JointPainSessionEvent) => {
    const result = reduceJointPainSession(stateRef.current, event);
    setState(result.state);
    return result.effects;
  }, []);

  const workoutExerciseIdStrings = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(workoutExerciseIds).map(([key, value]) => [
          key,
          value as string,
        ])
      ),
    [workoutExerciseIds]
  );

  const config: JointPainSessionConfig = useMemo(
    () => ({
      open,
      targetExerciseId,
      workoutId,
      exercises,
      workoutExerciseIds: workoutExerciseIdStrings,
      existingFeedback,
    }),
    [
      open,
      targetExerciseId,
      workoutId,
      exercises,
      workoutExerciseIdStrings,
      existingFeedback,
    ]
  );

  const viewModel = useMemo(
    () => selectJointPainViewModel(config, state),
    [config, state]
  );

  useEffect(() => {
    if (open && !prevOpenRef.current) {
      dispatch({ type: "opened" });
    } else if (!open && prevOpenRef.current) {
      dispatch({ type: "closed" });
    }
    prevOpenRef.current = open;
  }, [open, dispatch]);

  useEffect(() => {
    if (!open || existingFeedback === undefined) return;
    if (prevFeedbackRef.current === existingFeedback) return;

    dispatch({
      type: "feedbackLoaded",
      savedLevels: prefillSavedLevels(
        exercises,
        workoutExerciseIdStrings,
        existingFeedback
      ),
    });
    prevFeedbackRef.current = existingFeedback;
  }, [open, existingFeedback, exercises, workoutExerciseIdStrings, dispatch]);

  useEffect(() => {
    if (!viewModel.shouldAutoComplete) return;

    dispatch({ type: "autoCompleteAcknowledged" });
    void onComplete();
  }, [viewModel.shouldAutoComplete, onComplete, dispatch]);

  const save = useCallback(
    async (level: JointPainLevel) => {
      const currentExercise = viewModel.currentExercise;
      if (!workoutId || !currentExercise) return;

      const workoutExerciseId = workoutExerciseIds[currentExercise.id];
      if (!workoutExerciseId) {
        toast({ type: "error", description: "Exercise not found in workout" });
        return;
      }

      dispatch({ type: "saveStarted" });

      try {
        await recordJointPain({
          workoutId,
          workoutExerciseId,
          jointPainLevel: level,
        });

        const effects = dispatch({
          type: "saveSucceeded",
          exerciseId: currentExercise.id,
          level,
          config,
        });

        for (const effect of effects) {
          if (effect.type === "complete") {
            await onComplete();
          } else {
            onSingleExerciseSaved(effect.exerciseId);
          }
        }
      } catch {
        dispatch({ type: "saveFailed" });
        toast({ type: "error", description: "Failed to save joint pain rating" });
      }
    },
    [
      viewModel.currentExercise,
      workoutId,
      workoutExerciseIds,
      recordJointPain,
      config,
      dispatch,
      onComplete,
      onSingleExerciseSaved,
    ]
  );

  return {
    ...viewModel,
    save,
  };
}
