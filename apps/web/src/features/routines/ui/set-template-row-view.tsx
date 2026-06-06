import { Trash2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { SetTemplateRowViewProps } from "@/features/routines/ui/types";

export function SetTemplateRowView({
  setNumber,
  template,
  canRemove,
  onPreviousChange,
  onUnitChange,
  onRemove,
}: SetTemplateRowViewProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-6 shrink-0 text-center text-[11px] tabular-nums text-foreground/50">
        {setNumber}
      </span>
      <Input
        value={template.previous}
        onChange={(e) => onPreviousChange(e.target.value)}
        placeholder="Previous"
        className="h-8 flex-1 text-xs"
      />
      <Input
        value={template.unit}
        onChange={(e) => onUnitChange(e.target.value)}
        placeholder="kg"
        className="h-8 w-16 text-xs"
      />
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        disabled={!canRemove}
        onClick={onRemove}
        aria-label="Remove set"
      >
        <Trash2Icon className="size-3.5" />
      </Button>
    </div>
  );
}
