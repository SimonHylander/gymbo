import { createFileRoute } from "@tanstack/react-router";

import { loadRoutines } from "@/features/routines/adapters/load-routines";
import { RoutinesPageContainer } from "@/features/routines/containers/routines-page-container";

export const Route = createFileRoute("/routines/")({
  loader: ({ context: { queryClient } }) => loadRoutines(queryClient),
  component: RoutinesPage,
});

function RoutinesPage() {
  return <RoutinesPageContainer />;
}
