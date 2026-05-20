import type { SetEntry } from "@/features/routine/domain/types";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type SetLoggerRowProps = {
  setNumber: number;
  set: SetEntry;
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

  return (
    <div
      className={cn(
        "grid grid-cols-[1.75rem_1.75rem_1fr_1fr_1fr_1.75rem] items-center gap-2",
        isCompleted && "opacity-60"
      )}
    >
      <Button
        type="button"
        variant="outline"
        size="icon-xs"
        className="size-7 shrink-0 text-sm"
        onClick={onDelete}
        disabled={!canDelete || deleteDisabled || isCompleted}
        aria-label="Remove set"
      >
        -
      </Button>
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-medium text-muted-foreground">
        {setNumber}
      </span>
      <button
        type="button"
        onClick={onApplyPrevious}
        disabled={!set.previous || isCompleted}
        className={cn(
          "h-8 truncate rounded-lg border border-transparent bg-muted/50 px-2 text-center text-xs text-muted-foreground transition-colors",
          set.previous &&
            !isCompleted &&
            "cursor-pointer hover:border-border hover:bg-muted hover:text-foreground",
          !set.previous && "cursor-default"
        )}
        title={set.previous ? "Use previous set" : undefined}
      >
        {set.previous || "—"}
      </button>
      <div className="relative">
        <Input
          type="number"
          inputMode="decimal"
          placeholder="—"
          value={set.weight}
          onChange={(e) => onWeightChange(e.target.value)}
          disabled={isCompleted}
          className="h-8 rounded-lg pr-8 pl-2 text-center text-sm"
          min={0}
          step={0.5}
        />
        <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-[10px] font-medium text-muted-foreground">
          {set.unit}
        </span>
      </div>
      <Input
        type="text"
        inputMode="numeric"
        placeholder="—"
        value={set.reps}
        onChange={(e) => onRepsChange(e.target.value)}
        disabled={isCompleted}
        className="h-8 rounded-lg px-2 text-center text-sm"
      />
      <Checkbox
        checked={isCompleted}
        onCheckedChange={() => onToggleComplete()}
        disabled={checkboxDisabled}
        aria-label={`Mark set ${setNumber} complete`}
        className={cn(
          "size-4 justify-self-center",
          isCompleted &&
            "border-emerald-600 bg-emerald-600 text-white data-[state=checked]:border-emerald-600 data-[state=checked]:bg-emerald-600 dark:border-emerald-500 dark:bg-emerald-500 dark:data-[state=checked]:border-emerald-500 dark:data-[state=checked]:bg-emerald-500"
        )}
      />
    </div>
  );
}
