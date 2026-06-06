import type { RoutinesEmptyStateProps } from "@/features/routines/ui/types";

const copy: Record<RoutinesEmptyStateProps["variant"], { title: string; body: string }> = {
  "no-routines": {
    title: "No routines yet",
    body: "Seed the database or create a routine to get started.",
  },
  "invalid-routine": {
    title: "Routine not found",
    body: "This routine may have been removed. Pick another from the list.",
  },
};

export function RoutinesEmptyState({ variant }: RoutinesEmptyStateProps) {
  const { title, body } = copy[variant];
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-card/50 px-6 py-16 text-center">
      <p className="font-semibold text-sm">{title}</p>
      <p className="mt-1 max-w-xs text-xs text-foreground/70">{body}</p>
    </div>
  );
}
