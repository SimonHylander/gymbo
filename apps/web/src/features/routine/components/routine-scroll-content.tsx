import type { ReactNode } from "react";
import { useEffect } from "react";

import { getAllCompleted } from "@/features/routine/domain/session-selectors";
import {
  useRoutineMeta,
  useRoutineSession,
} from "@/features/routine/store/routine-session-context";
import { cn } from "@/lib/utils";

type RoutineScrollContentProps = {
  children: ReactNode;
};

function RoutineScrollSync() {
  const notes = useRoutineSession((state) => state.notes);
  const activeExerciseId = useRoutineSession((state) => state.activeExerciseId);
  const routine = useRoutineSession((state) => state.routine);
  const exerciseLogs = useRoutineSession((state) => state.exerciseLogs);
  const { scrollToBottom } = useRoutineMeta();

  const allCompleted = getAllCompleted(routine, exerciseLogs);

  useEffect(() => {
    scrollToBottom();
  }, [notes, allCompleted, activeExerciseId, scrollToBottom]);

  return null;
}

export function RoutineScrollContent({ children }: RoutineScrollContentProps) {
  const { scrollRef } = useRoutineMeta();
  const restTimerVisible = useRoutineSession((state) => state.restTimer !== null);

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto">
      <RoutineScrollSync />
      <div
        className={cn(
          "mx-auto flex min-h-full max-w-2xl flex-col gap-4 px-4 py-6",
          restTimerVisible && "pb-32"
        )}
      >
        {children}
        <div className="min-h-2" />
      </div>
    </div>
  );
}
