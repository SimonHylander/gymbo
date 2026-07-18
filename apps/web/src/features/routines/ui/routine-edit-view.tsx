import type { RoutineEditViewProps } from "@/features/routines/ui/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ExercisePickerView } from "@/features/routines/ui/exercise-picker-view";
import { RoutineEditExerciseView } from "@/features/routines/ui/routine-edit-exercise-view";

export function RoutineEditView({
  draft,
  isSaving,
  catalogOptions,
  catalogLoading,
  catalogSearch,
  onCatalogSearchChange,
  onNameChange,
  onSave,
  onCancel,
  onAddExercise,
  onRemoveExercise,
  onExerciseRepTargetChange,
  onExerciseRestChange,
  onExerciseNotesChange,
  onAddSet,
  onRemoveSet,
  onSetTemplateChange,
}: RoutineEditViewProps) {
  return (
    <section className="flex flex-col gap-4 rounded-xl border border-border/50 bg-card p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <label className="mb-1 block text-[11px] text-foreground/60">
            Routine name
          </label>
          <Input
            value={draft.name}
            onChange={(e) => onNameChange(e.target.value)}
            className="h-9 font-semibold text-sm"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onCancel} disabled={isSaving}>
            Cancel
          </Button>
          <Button size="sm" onClick={onSave} disabled={isSaving}>
            {isSaving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-border/40 pt-3">
        <p className="text-xs font-medium text-foreground/70">Exercises</p>
        <ExercisePickerView
          options={catalogOptions}
          isLoading={catalogLoading}
          search={catalogSearch}
          onSearchChange={onCatalogSearchChange}
          onSelect={onAddExercise}
        />
      </div>

      <div className="flex flex-col gap-3">
        {draft.exercises.map((exercise, index) => (
          <RoutineEditExerciseView
            key={exercise.externalId}
            exercise={exercise}
            index={index}
            onRepTargetChange={(value) => onExerciseRepTargetChange(index, value)}
            onRestChange={(v) => onExerciseRestChange(index, v)}
            onNotesChange={(v) => onExerciseNotesChange(index, v)}
            onAddSet={() => onAddSet(index)}
            onRemoveSet={(setIndex) => onRemoveSet(index, setIndex)}
            onSetTemplateChange={(setIndex, field, value) =>
              onSetTemplateChange(index, setIndex, field, value)
            }
            onRemoveExercise={() => onRemoveExercise(index)}
          />
        ))}
      </div>
    </section>
  );
}
