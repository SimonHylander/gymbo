import { RoutineListCardsView } from "@/features/routines/ui/routine-list-cards-view";
import { RoutinesHeader } from "@/features/routines/ui/routines-header";
import { RoutinesEmptyState } from "@/features/routines/ui/routines-empty-states";
import { useRoutinesPage } from "@/features/routines/hooks/use-routines-page";

export function RoutinesPageContainer() {
  const { list, isListLoading } = useRoutinesPage();

  const hasAnyRoutines =
    list &&
    (list.programs.some((p) => p.routines.length > 0) ||
      list.unassignedRoutines.length > 0);

  return (
    <div className="flex h-dvh flex-col bg-background">
      <RoutinesHeader />
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4">
        {!isListLoading && list && !hasAnyRoutines ? (
          <RoutinesEmptyState variant="no-routines" />
        ) : (
          <RoutineListCardsView
            programs={list?.programs ?? []}
            unassignedRoutines={list?.unassignedRoutines ?? []}
            isLoading={isListLoading}
          />
        )}
      </div>
    </div>
  );
}
