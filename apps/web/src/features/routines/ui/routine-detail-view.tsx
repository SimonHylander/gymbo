import { Link } from "@tanstack/react-router";
import { PencilIcon, PlayIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  routineDetailStats,
  routineExerciseNamePreview,
} from "@/features/routines/domain/routine-detail-summary";
import type { RoutineDetailViewProps } from "@/features/routines/ui/types";

export function RoutineDetailView({
  detail,
  hasOngoingWorkout,
  isLoading,
  isEditMode,
  editDisabledReason,
  onEdit,
  onStartWorkout,
}: RoutineDetailViewProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-border/50 bg-card p-6">
        <p className="text-sm text-foreground/70">Loading routine…</p>
      </div>
    );
  }

  if (!detail) {
    return null;
  }

  if (isEditMode) {
    return null;
  }

  const editDisabled = Boolean(editDisabledReason);
  const { exerciseCount, totalSets } = routineDetailStats(detail.exercises);
  const { preview, remaining } = routineExerciseNamePreview(detail.exercises);

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-border/50 bg-card p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate font-semibold text-sm">{detail.name}</h2>
        </div>
        <div className="flex shrink-0 gap-2">
          {editDisabled ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button variant="outline" size="sm" disabled className="h-9">
                    <PencilIcon className="mr-1.5 size-3.5" />
                    Edit
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>{editDisabledReason}</TooltipContent>
            </Tooltip>
          ) : (
            <Button variant="outline" size="sm" onClick={onEdit} className="h-9">
              <PencilIcon className="mr-1.5 size-3.5" />
              Edit
            </Button>
          )}
          <Button variant="default" size="sm" onClick={onStartWorkout} className="h-9">
            <PlayIcon className="mr-1.5 size-3.5" />
            {hasOngoingWorkout ? "Resume workout" : "Start workout"}
          </Button>
        </div>
      </div>

      <div className="border-t border-border/40 pt-3">
        <p className="text-xs text-foreground/70">
          {exerciseCount} exercise{exerciseCount === 1 ? "" : "s"} · {totalSets}{" "}
          set{totalSets === 1 ? "" : "s"}
        </p>
        {preview ? (
          <p className="mt-1 text-sm text-foreground/60">
            {preview}
            {remaining > 0 ? (
              <span className="text-foreground/50"> +{remaining} more</span>
            ) : null}
          </p>
        ) : null}
      </div>

      {detail.nextRoutine ? (
        <p className="text-xs text-foreground/60">
          Next in program:{" "}
          <Link
            to="/routines/$id"
            params={{ id: detail.nextRoutine.externalId }}
            className="font-medium text-foreground underline-offset-2 hover:underline"
          >
            {detail.nextRoutine.name}
          </Link>
        </p>
      ) : null}
    </section>
  );
}
