import { memo } from "react";
import { Trash2Icon } from "lucide-react";

import type { RoutineEditExerciseViewProps } from "@/features/routines/ui/types";
import { RepPicker } from "@/components/rep-picker";
import { RestDurationPicker } from "@/components/rest-duration-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SetTemplateRowView } from "@/features/routines/ui/set-template-row-view";

export const RoutineEditExerciseView = memo(function RoutineEditExerciseView({
  exercise,
  index,
  onRepTargetChange,
  onRestChange,
  onNotesChange,
  onAddSet,
  onRemoveSet,
  onSetTemplateChange,
  onRemoveExercise,
}: RoutineEditExerciseViewProps) {
  return (
    <div className="rounded-lg border border-border/50 bg-background/50 p-3">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-medium text-[13px]">{exercise.name}</p>
          <p className="text-[11px] text-foreground/50">Exercise {index + 1}</p>
          <div className="mt-1.5">
            <RestDurationPicker
              exerciseName={exercise.name}
              value={exercise.restSeconds}
              onValueChange={onRestChange}
            />
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onRemoveExercise}
          aria-label="Remove exercise"
        >
          <Trash2Icon className="size-3.5" />
        </Button>
      </div>

      <div className="mb-3 flex flex-wrap items-end gap-x-4 gap-y-2">
        <div className="w-fit shrink-0">
          <label className="mb-1 block text-[11px] text-foreground/60">Reps</label>
          <RepPicker
            key={exercise.externalId}
            reps={exercise.reps}
            repRangeMin={exercise.repRangeMin}
            repRangeMax={exercise.repRangeMax}
            onChange={onRepTargetChange}
          />
        </div>
        <div className="min-w-0 flex-1 basis-48">
          <label className="mb-1 block text-[11px] text-foreground/60">Notes</label>
          <Input
            value={exercise.notes ?? ""}
            onChange={(e) => onNotesChange(e.target.value)}
            className="h-8 text-xs"
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-medium text-foreground/70">Sets</p>
          <Button type="button" variant="outline" size="sm" onClick={onAddSet}>
            Add set
          </Button>
        </div>
        {exercise.setTemplates.map((template, setIndex) => (
          <SetTemplateRowView
            key={setIndex}
            setNumber={setIndex + 1}
            template={template}
            canRemove={exercise.setTemplates.length > 1}
            onPreviousChange={(v) =>
              onSetTemplateChange(setIndex, "previous", v)
            }
            onUnitChange={(v) => onSetTemplateChange(setIndex, "unit", v)}
            onRemove={() => onRemoveSet(setIndex)}
          />
        ))}
      </div>
    </div>
  );
});
