import { ArrowLeftIcon, PlayIcon, SquareIcon } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import {
  formatWorkoutElapsedMinutes,
  getWorkoutElapsedMs,
} from "@/features/routine/domain/workout-timer";
import { getWorkoutStats } from "@/features/routine/domain/session-selectors";
import {
  useRoutineActions,
  useRoutineSession,
} from "@/features/routine/store/routine-session-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function formatVolume(kg: number): string {
  if (kg <= 0) return "0 kg";
  if (kg >= 10_000) {
    return `${(kg / 1000).toFixed(1)}k kg`;
  }
  return `${Math.round(kg).toLocaleString()} kg`;
}

function OverviewStat({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center gap-0.5 text-center", className)}>
      <span className="font-semibold text-sm tabular-nums tracking-tight">
        {value}
      </span>
      <span className="text-[11px] text-muted-foreground">{label}</span>
    </div>
  );
}

function TimeOverviewStat() {
  const workoutStartedAt = useRoutineSession((state) => state.workoutStartedAt);
  const workoutEndedAt = useRoutineSession((state) => state.workoutEndedAt);
  const workoutStatus = useRoutineSession((state) => state.workoutStatus);
  const isStartingWorkout = useRoutineSession((state) => state.isStartingWorkout);
  const isStoppingWorkout = useRoutineSession((state) => state.isStoppingWorkout);
  const { startWorkout, stopWorkout } = useRoutineActions();
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

  if (workoutStatus === "completed") {
    return (
      <OverviewStat
        label="Time"
        value={workoutStartedAt === null ? "0:00.0" : elapsedTime}
      />
    );
  }

  if (workoutStartedAt === null) {
    return (
      <div className="flex flex-col items-center gap-0.5 text-center">
        <Button
          variant="default"
          size="sm"
          onClick={() => void startWorkout()}
          disabled={isStartingWorkout}
          className="h-7 gap-1 px-2.5 text-xs"
        >
          <PlayIcon className="size-3" />
          {isStartingWorkout ? "Starting…" : "Start"}
        </Button>
        <span className="text-[11px] text-muted-foreground">Time</span>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col items-center gap-0.5 text-center"
      aria-live="polite"
      aria-label={`Workout elapsed time ${elapsedTime}`}
    >
      <div className="flex items-center gap-1">
        <span className="font-semibold text-sm tabular-nums tracking-tight">
          {elapsedTime}
        </span>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => void stopWorkout()}
          disabled={isStoppingWorkout}
          className="size-6 text-muted-foreground hover:text-destructive"
          aria-label="End workout"
        >
          <SquareIcon className="size-3 fill-current" />
        </Button>
      </div>
      <span className="text-[11px] text-muted-foreground">Time</span>
    </div>
  );
}

export function RoutineHeader() {
  const navigate = useNavigate();
  const name = useRoutineSession((state) => state.routine.name);
  const exerciseLogs = useRoutineSession((state) => state.exerciseLogs);

  const { completedSets, totalVolumeKg } = getWorkoutStats(exerciseLogs);

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-border/50 bg-card p-4 shadow-sm">
      <div className="flex min-w-0 items-center gap-2">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => navigate({ to: "/" })}
          aria-label="Go back"
        >
          <ArrowLeftIcon className="size-4" />
        </Button>
        <h2 className="min-w-0 truncate font-semibold text-sm">{name}</h2>
      </div>

      <div className="grid grid-cols-3 gap-2 border-t border-border/40 pt-3">
        <TimeOverviewStat />
        <OverviewStat label="Volume" value={formatVolume(totalVolumeKg)} />
        <OverviewStat label="Sets" value={String(completedSets)} />
      </div>
    </section>
  );
}
