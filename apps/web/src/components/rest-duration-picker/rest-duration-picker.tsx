"use client";

import { TimerIcon } from "lucide-react";
import { useCallback, useState } from "react";

import {
  REST_DURATION_OPTION_SECONDS,
  formatRestDurationPickerLabel,
  nearestRestDurationOption,
} from "@workspace/domain/lib/rest-duration-options";
import { RestDurationWheel } from "@/components/rest-duration-picker/rest-duration-wheel";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const DEFAULT_PREVIEW_SECONDS = 120;

export type RestDurationPickerProps = {
  value?: number;
  exerciseName?: string;
  onValueChange: (seconds: number | undefined) => void;
  disabled?: boolean;
};

function getTriggerLabel(value: number | undefined): string {
  if (value === undefined) {
    return "Not set";
  }

  return formatRestDurationPickerLabel(value);
}

export function RestDurationPicker({
  value,
  exerciseName,
  onValueChange,
  disabled = false,
}: RestDurationPickerProps) {
  const [open, setOpen] = useState(false);
  const [previewSeconds, setPreviewSeconds] = useState(
    nearestRestDurationOption(value ?? DEFAULT_PREVIEW_SECONDS)
  );

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (nextOpen) {
        setPreviewSeconds(
          nearestRestDurationOption(value ?? DEFAULT_PREVIEW_SECONDS)
        );
      }

      setOpen(nextOpen);
    },
    [value]
  );

  const handleDone = useCallback(() => {
    onValueChange(previewSeconds);
    setOpen(false);
  }, [onValueChange, previewSeconds]);

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "inline-flex items-center gap-1.5 text-[12px] text-primary transition-colors",
            "hover:underline disabled:pointer-events-none disabled:opacity-50"
          )}
        >
          <TimerIcon className="size-3.5 shrink-0" aria-hidden />
          <span>
            Rest timer:{" "}
            <span className="font-medium">{getTriggerLabel(value)}</span>
          </span>
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="w-[280px] gap-0 p-0"
        side="bottom"
        sideOffset={6}
      >
        <div className="border-b border-border/40 px-4 py-3 text-center">
          <p className="text-sm font-semibold text-foreground">Rest timer</p>
          {exerciseName ? (
            <p className="mt-0.5 text-[11px] text-foreground/55">
              {exerciseName}
            </p>
          ) : null}
        </div>

        <div className="px-2 py-2">
          {open ? (
            <RestDurationWheel
              formatLabel={formatRestDurationPickerLabel}
              options={REST_DURATION_OPTION_SECONDS}
              value={previewSeconds}
              onValueChange={setPreviewSeconds}
            />
          ) : null}
        </div>

        <div className="border-t border-border/40 p-3">
          <Button className="w-full" size="sm" type="button" onClick={handleDone}>
            Done
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
