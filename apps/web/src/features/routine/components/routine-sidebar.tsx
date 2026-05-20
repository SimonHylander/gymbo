import { CheckIcon } from "lucide-react";

import { getCompletedIds } from "@/features/routine/domain/session-selectors";
import {
  useRoutineActions,
  useRoutineSession,
} from "@/features/routine/store/routine-session-context";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

export function RoutineSidebar() {
  const routine = useRoutineSession((state) => state.routine);
  const activeExerciseId = useRoutineSession((state) => state.activeExerciseId);
  const exerciseLogs = useRoutineSession((state) => state.exerciseLogs);
  const { selectExercise } = useRoutineActions();

  const completedIds = getCompletedIds(routine, exerciseLogs);
  const completedCount = completedIds.size;

  return (
    <Sidebar collapsible="offcanvas">
      <SidebarHeader className="gap-0 border-b border-sidebar-border pb-3">
        <p className="px-2 text-[13px] font-semibold text-sidebar-foreground">
          {routine.name}
        </p>
        <p className="px-2 text-xs text-sidebar-foreground/50">
          {completedCount} / {routine.exercises.length} done
        </p>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup className="p-2">
          <SidebarGroupLabel>Exercises</SidebarGroupLabel>
          <SidebarMenu>
            {routine.exercises.map((exercise, idx) => {
              const isDone = completedIds.has(exercise.id);
              const isActive = exercise.id === activeExerciseId;

              return (
                <SidebarMenuItem key={exercise.id}>
                  <SidebarMenuButton
                    isActive={isActive}
                    onClick={() => selectExercise(exercise.id)}
                    size="lg"
                    className={cn(
                      "h-auto flex-col items-start gap-0 rounded-lg py-2 transition-[background-color,opacity,transform] duration-300 ease-out",
                      isActive && "translate-x-0.5",
                      isDone && "opacity-60"
                    )}
                    tooltip={exercise.name}
                  >
                    <div className="flex w-full items-center gap-2">
                      <span
                        className={cn(
                          "flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold transition-all duration-300 ease-out",
                          isDone
                            ? "bg-emerald-500 text-white"
                            : isActive
                              ? "bg-sidebar-primary text-sidebar-primary-foreground scale-105"
                              : "bg-sidebar-accent text-sidebar-accent-foreground"
                        )}
                      >
                        {isDone ? (
                          <CheckIcon className="size-3 stroke-[2.5]" />
                        ) : (
                          idx + 1
                        )}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[13px] leading-snug">
                        {exercise.name}
                      </span>
                    </div>
                    {(exercise.sets.length > 0 || exercise.reps) && (
                      <span className="ml-7 text-[11px] text-sidebar-foreground/50 group-data-[collapsible=icon]:hidden">
                        {[
                          exercise.sets.length > 0 &&
                            `${exercise.sets.length} sets`,
                          exercise.reps && `${exercise.reps} reps`,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  );
}
