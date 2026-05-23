import { createFileRoute } from "@tanstack/react-router";

import { loadRoutine } from "@/features/routine/adapters/load-routine";
import { Routine } from "@/features/routine/components";

export const Route = createFileRoute("/routine/$id")({
  loader: ({ context: { queryClient }, params }) =>
    loadRoutine(queryClient, params.id),
  component: RoutinePage,
});

function RoutinePage() {
  const { routine, ongoingSession, nextRoutine } = Route.useLoaderData();

  return (
    <Routine.Provider
      key={routine.id}
      routine={routine}
      ongoingSession={ongoingSession}
      nextRoutine={nextRoutine}
    >
      <Routine.Shell>
        <Routine.ScrollContent>
          <Routine.Header />
          <Routine.ExerciseStage />
          <Routine.NoteFeed />
          <Routine.Summary />
        </Routine.ScrollContent>
        <Routine.RestTimer />
        <Routine.NoteComposer />
      </Routine.Shell>
    </Routine.Provider>
  );
}
