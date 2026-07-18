import type { ReactNode } from "react";
import { useEffect } from "react";

import { REST_TIMER_SCROLL_INSET_CLASS } from "@workspace/domain/routine/domain/rest-timer-presentation";
import { getAllCompleted } from "@workspace/domain/routine/domain/session-selectors";
import {
  useRoutineMeta,
  useRoutineSession,
} from "@/features/routine/store/routine-session-context";
import { useRestTimerPresentation } from "@/features/routine/store/use-rest-timer-presentation";
import { cn } from "@/lib/utils";

type RoutineScrollContentProps = {
  children: ReactNode;
};

function RoutineScrollSync() {
  const notes = useRoutineSession((state) => state.notes);
  const routine = useRoutineSession((state) => state.routine);
  const exerciseLogs = useRoutineSession((state) => state.exerciseLogs);
  const { scrollToBottom } = useRoutineMeta();

  const allCompleted = getAllCompleted(routine, exerciseLogs);

  useEffect(() => {
    scrollToBottom();
  }, [notes, allCompleted, scrollToBottom]);

  return null;
}

export function RoutineScrollContent({ children }: RoutineScrollContentProps) {
  const { scrollRef } = useRoutineMeta();
  const { showScrollInset } = useRestTimerPresentation();

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto">
      <RoutineScrollSync />
      <div
        className={cn(
          "mx-auto flex min-h-full max-w-2xl flex-col gap-4 px-4 py-6 pb-safe",
          showScrollInset && REST_TIMER_SCROLL_INSET_CLASS
        )}
      >
        {children}
        <div className="min-h-2" />
      </div>
    </div>
  );
}
