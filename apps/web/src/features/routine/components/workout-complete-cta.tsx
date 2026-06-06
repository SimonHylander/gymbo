import { ArrowRightIcon } from "lucide-react";

import {
  useRoutineSession,
  useWorkoutLifecycle,
} from "@/features/routine/store/routine-session-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type WorkoutCompleteCtaProps = {
  variant?: "summary" | "card";
};

export function WorkoutCompleteCta({ variant = "summary" }: WorkoutCompleteCtaProps) {
  const { nextRoutine, proceedToNext } = useWorkoutLifecycle();
  const isStoppingWorkout = useRoutineSession((state) => state.isStoppingWorkout);
  const workoutStatus = useRoutineSession((state) => state.workoutStatus);

  if (!nextRoutine && workoutStatus === "completed") {
    return null;
  }

  const label = nextRoutine
    ? `Next workout: ${nextRoutine.name}`
    : "Finish workout";

  return (
    <Button
      type="button"
      size="sm"
      disabled={isStoppingWorkout}
      onClick={() => void proceedToNext()}
      className={cn(
        "w-full shrink-0 gap-1.5",
        variant === "summary" &&
          "bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500",
        variant === "card" &&
          "border border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:border-emerald-800/40 dark:bg-emerald-950/30 dark:text-emerald-300 dark:hover:bg-emerald-900/30"
      )}
    >
      {isStoppingWorkout ? "Finishing…" : label}
      {!isStoppingWorkout && nextRoutine && <ArrowRightIcon className="size-3.5" />}
    </Button>
  );
}
