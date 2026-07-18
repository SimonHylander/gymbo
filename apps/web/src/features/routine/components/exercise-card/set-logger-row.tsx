import { parsePrevious } from "@workspace/domain/routine/domain/exercise-log";
import type { SetEntry } from "@workspace/domain/routine/domain/types";
import { CheckCircle2Icon, Trash2Icon } from "lucide-react";
import { useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type SetLoggerRowProps = {
  setNumber: number;
  set: SetEntry;
  isActive: boolean;
  canDelete: boolean;
  deleteDisabled: boolean;
  completeDisabled: boolean;
  onToggleComplete: () => void;
  onApplyPrevious: () => void;
  onRepsChange: (val: string) => void;
  onWeightChange: (val: string) => void;
  onDelete: () => void;
};

export function SetLoggerRow({
  setNumber,
  set,
  isActive,
  canDelete,
  deleteDisabled,
  completeDisabled,
  onToggleComplete,
  onApplyPrevious,
  onRepsChange,
  onWeightChange,
  onDelete,
}: SetLoggerRowProps) {
  const isCompleted = set.status === "completed";
  const checkboxDisabled = completeDisabled || deleteDisabled;
  const hasLoggedValues = Boolean(set.weight.trim() || set.reps.trim());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const previousValues = set.previous ? parsePrevious(set.previous) : null;
  const weightPlaceholder = previousValues?.weight ?? "—";
  const repsPlaceholder = previousValues?.reps ?? "—";

  const handleDelete = () => {
    if (hasLoggedValues) {
      setDeleteDialogOpen(true);
      return;
    }
    onDelete();
  };

  const inputClassName =
    "h-10 rounded-lg border-border bg-input/50 px-2 text-center text-sm tabular-nums focus-visible:ring-2 focus-visible:ring-primary/50 sm:h-10 max-sm:h-11 max-sm:text-base";

  const rowClassName = cn(
    "rounded-lg border border-transparent p-2 transition-colors",
    isActive && !isCompleted && "border-primary/40 bg-primary/5 ring-1 ring-primary/40",
    isCompleted &&
      "border-emerald-500/30 bg-emerald-500/10 opacity-90"
  );

  return (
    <>
      <div
        className={cn(
          rowClassName,
          "hidden sm:grid sm:grid-cols-[2.75rem_2.75rem_1fr_1fr_1fr_2.75rem] sm:items-center sm:gap-2"
        )}
      >
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="size-11 shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          onClick={handleDelete}
          disabled={!canDelete || deleteDisabled || isCompleted}
          aria-label={`Remove set ${setNumber}`}
        >
          <Trash2Icon className="size-4" />
        </Button>
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-foreground/70">
          {setNumber}
        </span>
        <PreviousCell
          set={set}
          setNumber={setNumber}
          isCompleted={isCompleted}
          onApplyPrevious={onApplyPrevious}
        />
        <div className="relative">
          <Input
            type="number"
            inputMode="decimal"
            placeholder={weightPlaceholder}
            value={set.weight}
            onChange={(e) => onWeightChange(e.target.value)}
            disabled={isCompleted}
            aria-label={`Weight for set ${setNumber}`}
            className={cn(inputClassName, "pr-8", isCompleted && "line-through")}
            min={0}
            step={0.5}
          />
          <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-xs font-medium text-foreground/70">
            {set.unit}
          </span>
        </div>
        <Input
          type="text"
          inputMode="numeric"
          placeholder={repsPlaceholder}
          value={set.reps}
          onChange={(e) => onRepsChange(e.target.value)}
          disabled={isCompleted}
          aria-label={`Reps for set ${setNumber}`}
          className={cn(inputClassName, isCompleted && "line-through")}
        />
        <CompleteButton
          setNumber={setNumber}
          isCompleted={isCompleted}
          disabled={checkboxDisabled}
          onToggleComplete={onToggleComplete}
        />
      </div>

      <div className={cn(rowClassName, "flex flex-col gap-2 sm:hidden")}>
        <div className="flex items-center justify-between gap-2">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-foreground/70">
            Set {setNumber}
          </span>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="size-11 shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              onClick={handleDelete}
              disabled={!canDelete || deleteDisabled || isCompleted}
              aria-label={`Remove set ${setNumber}`}
            >
              <Trash2Icon className="size-4" />
            </Button>
            <CompleteButton
              setNumber={setNumber}
              isCompleted={isCompleted}
              disabled={checkboxDisabled}
              onToggleComplete={onToggleComplete}
            />
          </div>
        </div>
        <PreviousCell
          set={set}
          setNumber={setNumber}
          isCompleted={isCompleted}
          onApplyPrevious={onApplyPrevious}
          fullWidth
        />
        <div className="grid grid-cols-2 gap-2">
          <div className="relative">
            <Input
              type="number"
              inputMode="decimal"
              placeholder={previousValues?.weight ?? "Weight"}
              value={set.weight}
              onChange={(e) => onWeightChange(e.target.value)}
              disabled={isCompleted}
              aria-label={`Weight for set ${setNumber}`}
              className={cn(inputClassName, "pr-8", isCompleted && "line-through")}
              min={0}
              step={0.5}
            />
            <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-xs font-medium text-foreground/70">
              {set.unit}
            </span>
          </div>
          <Input
            type="text"
            inputMode="numeric"
            placeholder={previousValues?.reps ?? "Reps"}
            value={set.reps}
            onChange={(e) => onRepsChange(e.target.value)}
            disabled={isCompleted}
            aria-label={`Reps for set ${setNumber}`}
            className={cn(inputClassName, isCompleted && "line-through")}
          />
        </div>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove set {setNumber}?</AlertDialogTitle>
            <AlertDialogDescription>
              This set has logged values. Removing it cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setDeleteDialogOpen(false);
                onDelete();
              }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function PreviousCell({
  set,
  setNumber,
  isCompleted,
  onApplyPrevious,
  fullWidth,
}: {
  set: SetEntry;
  setNumber: number;
  isCompleted: boolean;
  onApplyPrevious: () => void;
  fullWidth?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onApplyPrevious}
      disabled={!set.previous || isCompleted}
      aria-label={
        set.previous
          ? `Fill set ${setNumber} from last workout`
          : `No last workout data for set ${setNumber}`
      }
      title={set.previous ? "Fill from last workout" : undefined}
      className={cn(
        "h-10 truncate rounded-lg border border-transparent bg-muted/50 px-2 text-center text-xs text-foreground/70 transition-colors max-sm:h-11",
        fullWidth && "w-full text-left",
        set.previous &&
          !isCompleted &&
          "cursor-pointer hover:border-border hover:bg-muted hover:text-foreground",
        !set.previous && "cursor-default"
      )}
    >
      {set.previous ? (
        <>
          <span className="sm:hidden text-[10px] uppercase tracking-wide text-foreground/50">
            Last workout ·{" "}
          </span>
          {set.previous}
        </>
      ) : (
        "—"
      )}
    </button>
  );
}

function CompleteButton({
  setNumber,
  isCompleted,
  disabled,
  onToggleComplete,
}: {
  setNumber: number;
  isCompleted: boolean;
  disabled: boolean;
  onToggleComplete: () => void;
}) {
  return (
    <Button
      type="button"
      variant={isCompleted ? "default" : "outline"}
      size="icon-sm"
      className={cn(
        "size-11 shrink-0 justify-self-center",
        isCompleted &&
          "border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-600/90 dark:border-emerald-500 dark:bg-emerald-500"
      )}
      onClick={onToggleComplete}
      disabled={disabled}
      aria-label={`Mark set ${setNumber} complete`}
      aria-pressed={isCompleted}
    >
      <CheckCircle2Icon className="size-5" />
      <span className="sr-only">Mark set {setNumber} complete</span>
    </Button>
  );
}
