import { MessageSquareIcon, TimerIcon } from "lucide-react";

import {
  useRoutineMeta,
  useRoutineSession,
} from "@/features/routine/store/routine-session-context";
import { useRestTimerPresentation } from "@/features/routine/store/use-rest-timer-presentation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function RoutineSessionToolbar() {
  const notes = useRoutineSession((state) => state.notes);
  const { durationLabel, isGloballyActive, activeBadgeClassName } =
    useRestTimerPresentation({ highlight: "global" });
  const { inputRef, scrollToBottom } = useRoutineMeta();

  const focusNotes = () => {
    inputRef.current?.focus();
    scrollToBottom();
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-9 gap-1.5 text-xs"
        onClick={focusNotes}
      >
        <MessageSquareIcon className="size-3.5" />
        Notes
        {notes.length > 0 && (
          <Badge variant="secondary" className="h-5 min-w-5 px-1 text-[10px]">
            {notes.length}
          </Badge>
        )}
      </Button>
      <Badge
        variant="outline"
        className={cn(
          "h-9 gap-1.5 px-3 text-xs font-normal",
          activeBadgeClassName
        )}
      >
        <TimerIcon className="size-3.5" />
        {isGloballyActive ? "Resting" : `${durationLabel} rest`}
      </Badge>
    </div>
  );
}
