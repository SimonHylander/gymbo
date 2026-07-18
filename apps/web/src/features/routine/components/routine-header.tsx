import { ArrowLeftIcon, PlayIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { LeaveWorkoutDialog } from "@/features/routine/components/leave-workout-dialog";
import {
  formatWorkoutElapsedMinutes,
  getWorkoutElapsedMs,
} from "@workspace/domain/routine/domain/workout-timer";
import { getAllCompleted, getWorkoutStats } from "@workspace/domain/routine/domain/session-selectors";
import {
  useRoutineSession,
  useWorkoutLifecycle,
  useWorkoutSessionMeta,
} from "@/features/routine/store/routine-session-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function formatVolume(kg: number): string {
  if (kg <= 0) return "0 kg";
  if (kg >= 10_000) {
    return `${(kg / 1000).toFixed(1)}k kg`;
  }
  return `${Math.round(kg).toLocaleString()} kg`;
}

function SyncStatusChip() {
  const { syncState, workoutStatus } = useWorkoutSessionMeta();

  if (workoutStatus !== "ongoing") return null;

  const label =
    syncState === "saving"
      ? "Saving…"
      : syncState === "saved"
        ? "Saved"
        : syncState === "error"
          ? "Save failed"
          : null;

  if (!label) return null;

  return (
    <Badge
      variant="outline"
      className={cn(
        "text-xs font-normal",
        syncState === "saved" && "border-emerald-500/30 text-emerald-600 dark:text-emerald-400",
        syncState === "error" && "border-destructive/40 text-destructive"
      )}
      aria-live="polite"
    >
      {label}
    </Badge>
  );
}

function WorkoutElapsedTime() {
  const { workoutStartedAt, workoutEndedAt, workoutStatus } =
    useWorkoutSessionMeta();
  const [now, setNow] = useState(() => Date.now());

  const isRunning =
    workoutStatus === "ongoing" && workoutStartedAt !== null;

  useEffect(() => {
    if (!isRunning) return;

    setNow(Date.now());
    const intervalId = window.setInterval(() => setNow(Date.now()), 100);
    return () => window.clearInterval(intervalId);
  }, [isRunning, workoutStartedAt]);

  const endTimestamp =
    workoutStatus === "completed" && workoutEndedAt !== null
      ? workoutEndedAt
      : now;

  const elapsedTime =
    workoutStartedAt === null
      ? "0:00.0"
      : formatWorkoutElapsedMinutes(
          getWorkoutElapsedMs(workoutStartedAt, endTimestamp)
        );

  return (
    <span
      className="font-semibold text-sm tabular-nums tracking-tight"
      aria-live="polite"
      aria-label={`Workout elapsed time ${elapsedTime}`}
    >
      {elapsedTime}
    </span>
  );
}

export function RoutineHeader() {
  const routine = useRoutineSession((state) => state.routine);
  const exerciseLogs = useRoutineSession((state) => state.exerciseLogs);
  const {
    workoutStatus,
    workoutStartedAt,
    isStartingWorkout,
    isStoppingWorkout,
    startWorkout,
  } = useWorkoutSessionMeta();
  const { requestFinish, shouldConfirmLeave, leaveWorkout } = useWorkoutLifecycle();

  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);

  const { completedSets, totalVolumeKg } = getWorkoutStats(exerciseLogs);
  const allExercisesCompleted = getAllCompleted(routine, exerciseLogs);

  const statusLabel =
    workoutStatus === "completed"
      ? "Workout complete"
      : workoutStatus === "ongoing"
        ? "Workout in progress"
        : "Not started";

  const handleBack = () => {
    if (shouldConfirmLeave()) {
      setLeaveDialogOpen(true);
      return;
    }

    void leaveWorkout();
  };

  const handleConfirmLeave = () => {
    setLeaveDialogOpen(false);
    void leaveWorkout();
  };

  const isCompact = workoutStatus === "ongoing";

  return (
    <>
      <section
        className={cn(
          "flex flex-col gap-3 rounded-xl border border-border/50 bg-card shadow-sm",
          isCompact ? "p-3" : "p-4"
        )}
      >
        <div className="flex min-w-0 items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-start gap-2">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleBack}
              aria-label="Go back"
              className="shrink-0"
            >
              <ArrowLeftIcon className="size-4" />
            </Button>
            <div className="min-w-0 flex-1">
              <h2 className="truncate font-semibold text-sm">{routine.name}</h2>
              <div className="mt-0.5 flex flex-wrap items-center gap-2">
                <p className="text-xs text-foreground/70">{statusLabel}</p>
                {workoutStatus === "ongoing" && workoutStartedAt !== null && (
                  <WorkoutElapsedTime />
                )}
                <SyncStatusChip />
              </div>
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-end gap-1">
            {workoutStatus === "pending" && (
              <Button
                variant="default"
                size="sm"
                onClick={() => void startWorkout()}
                disabled={isStartingWorkout}
                className="h-9 gap-1.5 px-3"
              >
                <PlayIcon className="size-3.5" />
                {isStartingWorkout ? "Starting…" : "Start workout"}
              </Button>
            )}
            {workoutStatus === "ongoing" && !allExercisesCompleted && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => void requestFinish()}
                disabled={isStoppingWorkout}
                className="h-9 px-3 hover:border-destructive/50 hover:text-destructive"
              >
                {isStoppingWorkout ? "Finishing…" : "Finish workout"}
              </Button>
            )}
            {workoutStatus === "completed" && (
              <Badge
                variant="secondary"
                className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
              >
                Done
              </Badge>
            )}
          </div>
        </div>

        <div
          className={cn(
            "flex items-center justify-between gap-4 border-t border-border/40 pt-3 text-xs text-foreground/70",
            isCompact && "pt-2"
          )}
        >
          <span>
            <span className="font-semibold tabular-nums text-foreground">
              {formatVolume(totalVolumeKg)}
            </span>{" "}
            volume
          </span>
          <span>
            <span className="font-semibold tabular-nums text-foreground">
              {completedSets}
            </span>{" "}
            sets done
          </span>
          {workoutStatus === "completed" && workoutStartedAt !== null && (
            <span className="hidden sm:inline">
              Time{" "}
              <WorkoutElapsedTime />
            </span>
          )}
        </div>
      </section>

      <LeaveWorkoutDialog
        open={leaveDialogOpen}
        onOpenChange={setLeaveDialogOpen}
        onConfirmLeave={handleConfirmLeave}
        isSaving={workoutStatus === "ongoing"}
      />
    </>
  );
}
