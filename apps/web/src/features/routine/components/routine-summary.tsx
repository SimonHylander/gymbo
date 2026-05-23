import { FlameIcon } from "lucide-react";

import { WorkoutCompleteCta } from "@/features/routine/components/workout-complete-cta";
import { getAllCompleted } from "@/features/routine/domain/session-selectors";
import { useRoutineSession } from "@/features/routine/store/routine-session-context";

export function RoutineSummary() {
  const routine = useRoutineSession((state) => state.routine);
  const exerciseLogs = useRoutineSession((state) => state.exerciseLogs);

  if (!getAllCompleted(routine, exerciseLogs)) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 shadow-sm dark:border-emerald-800/50 dark:bg-emerald-950/20">
      <div className="flex items-center gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500 text-white">
          <FlameIcon className="size-4" />
        </div>
        <div>
          <p className="font-semibold text-sm text-emerald-800 dark:text-emerald-300">
            Workout complete!
          </p>
          <p className="text-xs text-emerald-600 dark:text-emerald-500">
            {routine.exercises.length} exercises logged
          </p>
        </div>
      </div>

      <div className="flex flex-col divide-y divide-emerald-100 dark:divide-emerald-900/50">
        {routine.exercises.map((exercise) => {
          const log = exerciseLogs[exercise.id];
          const summary = log.sets
            .map((set) => {
              const reps = set.reps || "?";
              const weight = set.weight ? `${set.weight}${set.unit}` : "bw";
              return `${reps}×${weight}`;
            })
            .join(", ");

          return (
            <div
              key={exercise.id}
              className="flex items-center justify-between gap-4 py-1.5 text-xs"
            >
              <span className="text-emerald-800/70 dark:text-emerald-300/70 truncate">
                {exercise.name}
              </span>
              <span className="shrink-0 font-medium text-emerald-800 dark:text-emerald-300">
                {summary}
              </span>
            </div>
          );
        })}
      </div>

      <WorkoutCompleteCta variant="summary" />
    </div>
  );
}
