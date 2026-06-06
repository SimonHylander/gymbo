import { convexQuery } from "@convex-dev/react-query";
import type { QueryClient } from "@tanstack/react-query";
import { notFound } from "@tanstack/react-router";

import { api } from "../../../../convex/_generated/api";
import type { RoutineLoaderData } from "@/features/routine/domain/types";

export async function loadRoutine(
  queryClient: QueryClient,
  externalId: string,
): Promise<RoutineLoaderData> {
  const [routine, ongoingSession] = await Promise.all([
    queryClient.ensureQueryData(
      convexQuery(api.routines.getByExternalId, { externalId }),
    ),
    queryClient.ensureQueryData(
      convexQuery(api.workouts.getOngoingForRoutine, { routineExternalId: externalId }),
    ),
  ]);

  if (!routine) {
    throw notFound();
  }

  return {
    routine: {
      id: routine.id,
      name: routine.name,
      exercises: routine.exercises,
    },
    ongoingSession: ongoingSession
      ? {
          workoutId: ongoingSession.workoutId,
          routineExternalId: ongoingSession.routineExternalId,
          status: ongoingSession.status,
          startedAt: ongoingSession.startedAt,
          endedAt: ongoingSession.endedAt,
          activeExerciseExternalId: ongoingSession.activeExerciseExternalId,
          exerciseLogs: ongoingSession.exerciseLogs,
          workoutExerciseIds: Object.fromEntries(
            Object.entries(ongoingSession.workoutExerciseIds).map(([k, v]) => [
              k,
              v as string,
            ]),
          ),
        }
      : null,
    nextRoutine: routine.nextRoutine,
  };
}
