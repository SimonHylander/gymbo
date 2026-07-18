import { useMemo } from "react";

import {
  
  
  selectRestTimerPresentation
} from "@workspace/domain/routine/domain/rest-timer-presentation";
import { getActiveExercise } from "@workspace/domain/routine/domain/session-selectors";
import type {RestTimerPresentation, RestTimerPresentationOptions} from "@workspace/domain/routine/domain/rest-timer-presentation";
import { useRoutineSession } from "@/features/routine/store/routine-session-context";

type UseRestTimerPresentationOptions = RestTimerPresentationOptions & {
  exerciseId?: string;
};

export function useRestTimerPresentation(
  options: UseRestTimerPresentationOptions = {}
): RestTimerPresentation {
  const { exerciseId, highlight = "global" } = options;

  const restTimer = useRoutineSession((state) => state.restTimer);
  const workoutStatus = useRoutineSession((state) => state.workoutStatus);
  const routine = useRoutineSession((state) => state.routine);
  const activeExerciseId = useRoutineSession((state) => state.activeExerciseId);

  const activeExercise = getActiveExercise(routine, activeExerciseId);

  return useMemo(
    () =>
      selectRestTimerPresentation(
        {
          restTimer,
          workoutStatus,
          activeExerciseRestSeconds: activeExercise?.restSeconds,
          exerciseId,
        },
        { highlight }
      ),
    [
      restTimer,
      workoutStatus,
      activeExercise?.restSeconds,
      exerciseId,
      highlight,
    ]
  );
}
