import {
  formatRestDurationLabel,
  getRestDuration,
} from "@/features/routine/domain/rest-timer";
import type { WorkoutStatus } from "@/features/routine/domain/types";

export const REST_TIMER_SCROLL_INSET_CLASS = "pb-32";
export const REST_TIMER_ACTIVE_BADGE_CLASS =
  "animate-pulse border-primary/30 bg-primary/5";

export type RestTimerPresentationInput = {
  restTimer: { exerciseId: string } | null;
  workoutStatus: WorkoutStatus;
  activeExerciseRestSeconds?: number;
  exerciseId?: string;
};

export type RestTimerPresentationOptions = {
  highlight?: "global" | "exercise";
};

export type RestTimerPresentation = {
  durationLabel: string;
  isGloballyActive: boolean;
  isActiveForExercise: boolean;
  showScrollInset: boolean;
  activeBadgeClassName: string | undefined;
};

export function selectRestTimerPresentation(
  input: RestTimerPresentationInput,
  options: RestTimerPresentationOptions = {}
): RestTimerPresentation {
  const { highlight = "global" } = options;
  const { restTimer, workoutStatus, activeExerciseRestSeconds, exerciseId } =
    input;

  const durationLabel = formatRestDurationLabel(
    getRestDuration(activeExerciseRestSeconds)
  );
  const isGloballyActive = restTimer !== null;
  const isActiveForExercise =
    exerciseId != null && restTimer?.exerciseId === exerciseId;
  const showScrollInset =
    restTimer !== null && workoutStatus !== "completed";

  const shouldHighlight =
    highlight === "exercise" ? isActiveForExercise : isGloballyActive;

  return {
    durationLabel,
    isGloballyActive,
    isActiveForExercise,
    showScrollInset,
    activeBadgeClassName: shouldHighlight
      ? REST_TIMER_ACTIVE_BADGE_CLASS
      : undefined,
  };
}
