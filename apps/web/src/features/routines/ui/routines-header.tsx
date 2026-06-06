import { ArrowLeftIcon } from "lucide-react";
import { Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";

type RoutinesHeaderProps = {
  backTo?: "/routines" | "/";
  title?: string;
  subtitle?: string;
};

export function RoutinesHeader({
  backTo = "/",
  title = "Routines",
  subtitle = "Browse, edit, and start workouts",
}: RoutinesHeaderProps) {
  return (
    <header className="flex items-center gap-2 border-b border-border/50 px-4 py-3">
      <Button variant="ghost" size="icon-sm" asChild aria-label="Back">
        <Link to={backTo}>
          <ArrowLeftIcon className="size-4" />
        </Link>
      </Button>
      <div className="min-w-0 flex-1">
        <h1 className="truncate font-semibold text-sm">{title}</h1>
        <p className="truncate text-xs text-foreground/70">{subtitle}</p>
      </div>
    </header>
  );
}
