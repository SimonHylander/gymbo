import { useReducedMotion } from "framer-motion";
import {
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PlusIcon,
  TimerIcon,
} from "lucide-react";
import { useEffect, useRef } from "react";

import {
  formatRestDurationLabel,
  getRestDuration,
} from "@/features/routine/domain/rest-timer";
import { isExerciseComplete } from "@/features/routine/domain/exercise-log";
import {
  getActiveExercise,
  getAllCompleted,
  getExerciseIndex,
} from "@/features/routine/domain/session-selectors";
import { WorkoutCompleteCta } from "@/features/routine/components/workout-complete-cta";
import {
  useRoutineActions,
  useRoutineSession,
} from "@/features/routine/store/routine-session-context";
import { SetLoggerRow } from "@/features/routine/components/exercise-card/set-logger-row";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export const exerciseCardHeight = "min(380px, calc(100dvh - 18rem))";

export function ExerciseCard() {
  const activeExerciseId = useRoutineSession((state) => state.activeExerciseId);
  const routine = useRoutineSession((state) => state.routine);
  const exerciseLogs = useRoutineSession((state) => state.exerciseLogs);
  const log = useRoutineSession((state) => state.exerciseLogs[activeExerciseId]);
  const restTimer = useRoutineSession((state) => state.restTimer);
  const {
    goToPreviousExercise,
    goToNextExercise,
    updateSet,
    applyPrevious,
    addSet,
    deleteSet,
    toggleSetComplete,
  } = useRoutineActions();

  const exercise = getActiveExercise(routine, activeExerciseId);
  const exerciseIndex = getExerciseIndex(routine, activeExerciseId);
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
  const canGoPrevious = exerciseIndex > 0;
  const canGoNext = exerciseIndex < totalExercises - 1;
  const restDurationLabel = formatRestDurationLabel(
    getRestDuration(exercise.restSeconds)
  );
  const isRestTimerActiveForExercise =
    restTimer?.exerciseId === activeExerciseId;

  return (
    <div
      style={{ height: exerciseCardHeight }}
      className={cn(
        "flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm transition-colors duration-200",
        completed
          ? "border-emerald-200 dark:border-emerald-800/50"
          : "border-border/50"
      )}
    >
      <div className="flex shrink-0 items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1.5">
          <p
            className={cn(
              "font-semibold text-sm leading-snug",
              completed && "text-emerald-700 dark:text-emerald-400"
            )}
          >
            {exercise.name}
          </p>
          <div className="flex flex-wrap items-center gap-1.5">
            {exercise.sets.length > 0 && exercise.reps && (
              <Badge variant="secondary" className="text-xs">
                {exercise.sets.length} × {exercise.reps}
              </Badge>
            )}
            <Badge
              variant="outline"
              className={cn(
                "gap-1 text-xs",
                isRestTimerActiveForExercise &&
                  "border-primary/30 bg-primary/5 text-foreground"
              )}
            >
              <TimerIcon className="size-3" />
              {restDurationLabel} rest
            </Badge>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-0.5">
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className="text-muted-foreground hover:text-foreground"
            onClick={goToPreviousExercise}
            disabled={!canGoPrevious}
            aria-label="Previous exercise"
          >
            <ChevronLeftIcon />
          </Button>

          <span className="min-w-[2.25rem] text-center text-[10px] font-medium tabular-nums tracking-wide text-muted-foreground">
            {exerciseIndex + 1}
            <span className="mx-0.5 text-muted-foreground/40">/</span>
            {totalExercises}
          </span>

          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className="text-muted-foreground hover:text-foreground"
            onClick={goToNextExercise}
            disabled={!canGoNext}
            aria-label="Next exercise"
          >
            <ChevronRightIcon />
          </Button>

          {completed && (
            <div className="ml-1 flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
              <CheckIcon className="size-3 stroke-[2.5]" />
            </div>
          )}
        </div>
      </div>

      {exercise.notes && (
        <p className="line-clamp-2 shrink-0 rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground italic leading-relaxed">
          {exercise.notes}
        </p>
      )}

      <div className="flex min-h-0 flex-1 flex-col gap-2">
        <div className="grid shrink-0 grid-cols-[1.75rem_1.75rem_1fr_1fr_1fr_1.75rem] items-center gap-2 px-0.5">
          <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground" />
          <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground" />
          <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Previous
          </span>
          <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Weight
          </span>
          <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Reps
          </span>
          <span />
        </div>

        <ScrollArea className="min-h-0 flex-1">
          <div className="flex flex-col gap-2 pr-3">
            {log.sets.map((set, idx) => (
              <SetLoggerRow
                key={idx}
                setNumber={idx + 1}
                set={set}
                canDelete={log.sets.length > 1}
                deleteDisabled={completed}
                completeDisabled={!set.weight && !set.reps}
                onToggleComplete={() => toggleSetComplete(activeExerciseId, idx)}
                onApplyPrevious={() => applyPrevious(activeExerciseId, idx)}
                onRepsChange={(val) =>
                  updateSet(activeExerciseId, idx, "reps", val)
                }
                onWeightChange={(val) =>
                  updateSet(activeExerciseId, idx, "weight", val)
                }
                onDelete={() => deleteSet(activeExerciseId, idx)}
              />
            ))}
            <div ref={setsEndRef} aria-hidden className="h-px shrink-0" />
          </div>
        </ScrollArea>
      </div>

      <Button
        variant="outline"
        size="sm"
        className="w-full shrink-0"
        onClick={() => addSet(activeExerciseId)}
        disabled={completed}
      >
        <PlusIcon className="size-3.5" />
        Add set
      </Button>

      {allCompleted && <WorkoutCompleteCta variant="card" />}
    </div>
  );
}
