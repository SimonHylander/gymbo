import { Link } from "@tanstack/react-router";
import { ChevronRightIcon } from "lucide-react";

import type { RoutineListCardsViewProps } from "@/features/routines/ui/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

function RoutineCard({
  externalId,
  name,
  exerciseCount,
  hasOngoingWorkout,
}: {
  externalId: string;
  name: string;
  exerciseCount: number;
  hasOngoingWorkout: boolean;
}) {
  return (
    <Link
      to="/routines/$id"
      params={{ id: externalId }}
      className={cn(
        "group flex items-center gap-3 rounded-xl border border-border/50 bg-card p-4 shadow-sm",
        "transition-colors hover:border-border hover:bg-card/80"
      )}
      style={{ contentVisibility: "auto" }}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-sm">{name}</p>
        <p className="mt-1 text-xs tabular-nums text-foreground/60">
          {exerciseCount} exercise{exerciseCount === 1 ? "" : "s"}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {hasOngoingWorkout ? (
          <Badge variant="secondary" className="text-[10px]">
            In progress
          </Badge>
        ) : null}
        <ChevronRightIcon className="size-4 text-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-foreground/70" />
      </div>
    </Link>
  );
}

export function RoutineListCardsView({
  programs,
  unassignedRoutines,
  isLoading,
}: RoutineListCardsViewProps) {
  if (isLoading) {
    return (
      <p className="text-sm text-foreground/70">Loading routines…</p>
    );
  }

  const hasAny =
    programs.some((p) => p.routines.length > 0) || unassignedRoutines.length > 0;

  if (!hasAny) {
    return null;
  }

  return (
    <div className="flex flex-col gap-6">
      {programs.map((program) =>
        program.routines.length > 0 ? (
          <section key={program.externalId} className="flex flex-col gap-3">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-foreground/50">
              {program.name}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {program.routines.map((routine) => (
                <RoutineCard key={routine.externalId} {...routine} />
              ))}
            </div>
          </section>
        ) : null
      )}
      {unassignedRoutines.length > 0 ? (
        <section className="flex flex-col gap-3">
          {programs.some((p) => p.routines.length > 0) ? (
            <h2 className="text-xs font-semibold uppercase tracking-wide text-foreground/50">
              Other
            </h2>
          ) : null}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {unassignedRoutines.map((routine) => (
              <RoutineCard key={routine.externalId} {...routine} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
