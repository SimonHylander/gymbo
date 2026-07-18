import { useReducedMotion } from "framer-motion";
import { CheckIcon, PlusIcon, TimerIcon } from "lucide-react";
import { useEffect, useRef } from "react";

import { isExerciseComplete } from "@workspace/domain/routine/domain/exercise-log";
import {
  getActiveExercise,
  getAllCompleted,
  getExerciseIndex,
} from "@workspace/domain/routine/domain/session-selectors";
import { formatRepTargetLabel } from "@workspace/domain/lib/rep-target";
import { WorkoutCompleteCta } from "@/features/routine/components/workout-complete-cta";
import { useExerciseLogging } from "@/features/routine/store/routine-session-context";
import { useRestTimerPresentation } from "@/features/routine/store/use-rest-timer-presentation";
import { SetLoggerRow } from "@/features/routine/components/exercise-card/set-logger-row";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export const exerciseCardHeight = "min(420px, calc(100dvh - 16rem))";

type ExerciseCardProps = {
  exerciseId?: string;
  layout?: "stage" | "list";
};

export function ExerciseCard({
  exerciseId: exerciseIdProp,
  layout = "stage",
}: ExerciseCardProps = {}) {
  const {
    activeExerciseId: storeActiveExerciseId,
    routine,
    exerciseLogs,
    updateSet,
    applyPrevious,
    addSet,
    deleteSet,
    toggleSetComplete,
  } = useExerciseLogging();

  const exerciseId = exerciseIdProp ?? storeActiveExerciseId;
  const isListLayout = layout === "list";
  const isActiveExercise = exerciseId === storeActiveExerciseId;

  const log = exerciseLogs[exerciseId];
  const { durationLabel, activeBadgeClassName } = useRestTimerPresentation({
    exerciseId,
    highlight: "exercise",
  });

  const exercise = getActiveExercise(routine, exerciseId);
  const exerciseIndex = getExerciseIndex(routine, exerciseId);
  const totalExercises = routine.exercises.length;
  const setsEndRef = useRef<HTMLDivElement>(null);
  const prevSetCountRef = useRef(log?.sets.length ?? 0);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (!log) return;

    if (log.sets.length > prevSetCountRef.current) {
      setsEndRef.current?.scrollIntoView({
        behavior: shouldReduceMotion ? "auto" : "smooth",
        block: "end",
      });
    }
    prevSetCountRef.current = log.sets.length;
  }, [log, shouldReduceMotion]);

  if (!exercise || !log) return null;

  const completed = isExerciseComplete(log);
  const allCompleted = getAllCompleted(routine, exerciseLogs);
  const activeSetIndex = log.sets.findIndex((set) => set.status !== "completed");
  const repLabel = formatRepTargetLabel({
    reps: exercise.reps,
    repRangeMin: exercise.repRangeMin,
    repRangeMax: exercise.repRangeMax,
  });
  const targetLabel =
    exercise.sets.length > 0 && repLabel
      ? `${exercise.sets.length} × ${repLabel}`
      : repLabel
        ? repLabel
        : exercise.sets.length > 0
          ? `${exercise.sets.length} sets`
          : null;

  const showWorkoutCompleteCta =
    allCompleted &&
    (isListLayout ? exerciseIndex === totalExercises - 1 : true);

  return (
    <div
      style={isListLayout ? undefined : { height: exerciseCardHeight }}
      className={cn(
        "flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm transition-[border-color,box-shadow] duration-200",
        completed
          ? "border-emerald-200 dark:border-emerald-800/50"
          : "border-border/50",
        isListLayout &&
          isActiveExercise &&
          !completed &&
          "border-primary/35 ring-2 ring-primary/20"
      )}
    >
      <div className="flex shrink-0 items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <p
              className={cn(
                "font-semibold text-sm leading-snug",
                completed && "text-emerald-700 dark:text-emerald-400"
              )}
            >
              {exercise.name}
            </p>
            {completed && (
              <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
                <CheckIcon className="size-3 stroke-[2.5]" />
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {targetLabel && (
              <Badge variant="secondary" className="text-xs">
                Target · {targetLabel}
              </Badge>
            )}
            <Badge
              variant="outline"
              className={cn(
                "gap-1 text-xs",
                activeBadgeClassName && "text-foreground",
                activeBadgeClassName
              )}
            >
              <TimerIcon className="size-3" />
              {durationLabel} rest
            </Badge>
          </div>
        </div>

        <span className="shrink-0 text-xs font-medium tabular-nums text-foreground/70">
          {exerciseIndex + 1} of {totalExercises}
        </span>
      </div>

      {exercise.notes && (
        <p className="line-clamp-2 shrink-0 rounded-lg bg-muted/60 px-3 py-2 text-xs text-foreground/70 italic leading-relaxed">
          {exercise.notes}
        </p>
      )}

      <div className="flex min-h-0 flex-1 flex-col gap-2">
        <div className="hidden shrink-0 grid-cols-[2.75rem_2.75rem_1fr_1fr_1fr_2.75rem] items-center gap-2 px-0.5 sm:grid">
          <span />
          <span className="text-xs font-medium text-foreground/70">Set</span>
          <span className="text-xs font-medium text-foreground/70">
            Last workout
          </span>
          <span className="text-xs font-medium text-foreground/70">Weight</span>
          <span className="text-xs font-medium text-foreground/70">Reps</span>
          <span className="text-center text-xs font-medium text-foreground/70">
            Done
          </span>
        </div>

        {isListLayout ? (
          <div className="flex flex-col gap-2">
            {log.sets.map((set, idx) => (
              <SetLoggerRow
                key={idx}
                setNumber={idx + 1}
                set={set}
                isActive={idx === activeSetIndex && !completed}
                canDelete={log.sets.length > 1}
                deleteDisabled={completed}
                completeDisabled={!set.weight && !set.reps}
                onToggleComplete={() => toggleSetComplete(exerciseId, idx)}
                onApplyPrevious={() => applyPrevious(exerciseId, idx)}
                onRepsChange={(val) => updateSet(exerciseId, idx, "reps", val)}
                onWeightChange={(val) =>
                  updateSet(exerciseId, idx, "weight", val)
                }
                onDelete={() => deleteSet(exerciseId, idx)}
              />
            ))}
          </div>
        ) : (
          <ScrollArea className="min-h-0 flex-1">
            <div className="flex flex-col gap-2 pr-3">
              {log.sets.map((set, idx) => (
                <SetLoggerRow
                  key={idx}
                  setNumber={idx + 1}
                  set={set}
                  isActive={idx === activeSetIndex && !completed}
                  canDelete={log.sets.length > 1}
                  deleteDisabled={completed}
                  completeDisabled={!set.weight && !set.reps}
                  onToggleComplete={() => toggleSetComplete(exerciseId, idx)}
                  onApplyPrevious={() => applyPrevious(exerciseId, idx)}
                  onRepsChange={(val) =>
                    updateSet(exerciseId, idx, "reps", val)
                  }
                  onWeightChange={(val) =>
                    updateSet(exerciseId, idx, "weight", val)
                  }
                  onDelete={() => deleteSet(exerciseId, idx)}
                />
              ))}
              <div ref={setsEndRef} aria-hidden className="h-px shrink-0" />
            </div>
          </ScrollArea>
        )}
      </div>

      <Button
        variant="outline"
        size="default"
        className="h-10 w-full shrink-0 border-border/80 font-medium"
        onClick={() => addSet(exerciseId)}
        disabled={completed}
      >
        <PlusIcon className="size-4" />
        Add set
      </Button>

      {showWorkoutCompleteCta && <WorkoutCompleteCta variant="card" />}
    </div>
  );
}
