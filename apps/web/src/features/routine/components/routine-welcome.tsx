import { DumbbellIcon } from "lucide-react";

import { useRoutineSession } from "@/features/routine/store/routine-session-context";

export function RoutineWelcome() {
  const routine = useRoutineSession((state) => state.routine);

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border/50 bg-card p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <DumbbellIcon className="size-4" />
        </div>
        <div>
          <p className="font-semibold text-sm">{routine.name}</p>
          <p className="text-muted-foreground text-xs">
            {routine.exercises.length} exercises
          </p>
        </div>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">
        Ready to train! Log your sets as you go — fill in the reps and weight
        for each set, then mark the exercise as done. Use the sidebar to
        navigate between exercises.
      </p>
    </div>
  );
}
