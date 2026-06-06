"use client";

import { ChevronDownIcon } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  deriveRepTargetMode,
  normalizeRepTargetForSave,
  parseRepInput,
  type RepTargetFields,
  type RepTargetMode,
} from "@/lib/rep-target";
import { cn } from "@/lib/utils";

export type RepPickerProps = RepTargetFields & {
  onChange: (value: RepTargetFields) => void;
  disabled?: boolean;
};

function formatInputValue(value: number | undefined): string {
  return value !== undefined ? String(value) : "";
}

export function RepPicker({
  reps,
  repRangeMin,
  repRangeMax,
  onChange,
  disabled = false,
}: RepPickerProps) {
  const derivedMode = useMemo(
    () => deriveRepTargetMode({ reps, repRangeMin, repRangeMax }),
    [reps, repRangeMin, repRangeMax]
  );
  const [mode, setMode] = useState<RepTargetMode>(derivedMode);

  const activeMode = mode;

  const handleModeChange = useCallback(
    (nextMode: RepTargetMode) => {
      setMode(nextMode);
      onChange(
        normalizeRepTargetForSave(nextMode, { reps, repRangeMin, repRangeMax })
      );
    },
    [onChange, reps, repRangeMin, repRangeMax]
  );

  const handleSingleChange = useCallback(
    (value: string) => {
      onChange({ reps: parseRepInput(value) });
    },
    [onChange]
  );

  const handleRangeMinChange = useCallback(
    (value: string) => {
      onChange({
        repRangeMin: parseRepInput(value),
        repRangeMax,
      });
    },
    [onChange, repRangeMax]
  );

  const handleRangeMaxChange = useCallback(
    (value: string) => {
      onChange({
        repRangeMin,
        repRangeMax: parseRepInput(value),
      });
    },
    [onChange, repRangeMin]
  );

  return (
    <div className="relative w-fit">
      {activeMode === "single" ? (
        <Input
          value={formatInputValue(reps)}
          onChange={(e) => handleSingleChange(e.target.value)}
          inputMode="numeric"
          min={0}
          placeholder="8"
          disabled={disabled}
          aria-label="Target reps"
          className="h-8 w-auto min-w-[4.5rem] pr-9 text-xs tabular-nums"
        />
      ) : (
        <div
          className={cn(
            "flex h-8 w-auto items-center gap-1 rounded-4xl border border-input bg-input/30 px-2.5 pr-9 text-xs",
            "focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50",
            disabled && "pointer-events-none opacity-50"
          )}
        >
          <input
            type="text"
            inputMode="numeric"
            min={0}
            value={formatInputValue(repRangeMin)}
            onChange={(e) => handleRangeMinChange(e.target.value)}
            disabled={disabled}
            aria-label="Rep range minimum"
            placeholder="6"
            className="w-8 bg-transparent text-center text-xs tabular-nums outline-none placeholder:text-muted-foreground"
          />
          <span className="shrink-0 text-foreground/50">to</span>
          <input
            type="text"
            inputMode="numeric"
            min={0}
            value={formatInputValue(repRangeMax)}
            onChange={(e) => handleRangeMaxChange(e.target.value)}
            disabled={disabled}
            aria-label="Rep range maximum"
            placeholder="12"
            className="w-8 bg-transparent text-center text-xs tabular-nums outline-none placeholder:text-muted-foreground"
          />
        </div>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            disabled={disabled}
            aria-label="Rep target type"
            className={cn(
              "absolute top-1/2 right-1 flex size-8 -translate-y-1/2 items-center justify-center rounded-full",
              "text-foreground/50 transition-colors hover:bg-foreground/5 hover:text-foreground/80",
              "disabled:pointer-events-none disabled:opacity-50"
            )}
          >
            <ChevronDownIcon className="size-3.5" aria-hidden />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[8rem]">
          <DropdownMenuRadioGroup
            value={activeMode}
            onValueChange={(value) => handleModeChange(value as RepTargetMode)}
          >
            <DropdownMenuRadioItem value="single">Reps</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="range">Rep range</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
