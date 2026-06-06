import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  JOINT_PAIN_OPTIONS,
  type JointPainLevel,
} from "@/features/routine/domain/joint-pain";
import { cn } from "@/lib/utils";

type JointPainCheckInDialogProps = {
  open: boolean;
  exerciseName: string;
  exerciseIndex: number;
  exerciseCount: number;
  initialLevel?: JointPainLevel | null;
  isSaving: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (level: JointPainLevel) => void;
  onCancel: () => void;
};

export function JointPainCheckInDialog({
  open,
  exerciseName,
  exerciseIndex,
  exerciseCount,
  initialLevel = null,
  isSaving,
  onOpenChange,
  onSave,
  onCancel,
}: JointPainCheckInDialogProps) {
  const [selectedLevel, setSelectedLevel] = useState<JointPainLevel | null>(
    initialLevel
  );

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      onCancel();
    }
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="gap-5 sm:max-w-lg" showCloseButton={!isSaving}>
        <DialogHeader className="gap-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Feedback · {exerciseIndex + 1} of {exerciseCount}
          </p>
          <DialogTitle className="text-lg font-semibold">Joint pain</DialogTitle>
          <DialogDescription className="text-sm text-foreground/80">
            How did your joints feel during{" "}
            <span className="font-medium text-foreground">{exerciseName}</span>?
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap gap-2">
          {JOINT_PAIN_OPTIONS.map((option) => {
            const isSelected = selectedLevel === option.level;

            return (
              <button
                key={option.level}
                type="button"
                disabled={isSaving}
                onClick={() => setSelectedLevel(option.level)}
                className={cn(
                  "rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                  "border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10",
                  "dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/15",
                  "disabled:pointer-events-none disabled:opacity-50",
                  isSelected &&
                    "border-emerald-600 bg-emerald-500/15 ring-1 ring-emerald-500/40 dark:border-emerald-500 dark:bg-emerald-500/20 dark:ring-emerald-400/40"
                )}
              >
                <span className="font-medium text-foreground">{option.label}</span>
              </button>
            );
          })}
        </div>

        {selectedLevel !== null && (
          <p className="text-xs leading-relaxed text-muted-foreground">
            {JOINT_PAIN_OPTIONS.find((option) => option.level === selectedLevel)
              ?.description}
          </p>
        )}

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            type="button"
            variant="ghost"
            disabled={isSaving}
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={selectedLevel === null || isSaving}
            className="bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500"
            onClick={() => {
              if (selectedLevel !== null) {
                onSave(selectedLevel);
              }
            }}
          >
            {isSaving ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
