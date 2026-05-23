import { convexQuery } from "@convex-dev/react-query";
import type { QueryClient } from "@tanstack/react-query";
import { notFound } from "@tanstack/react-router";

import { api } from "../../../../convex/_generated/api";
import type { RoutineLoaderData } from "@/features/routine/domain/types";
import { MOCK_PROGRAM_ROUTINE_IDS } from "@/lib/db/data/mock-routine-seed";

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

  const currentIndex = MOCK_PROGRAM_ROUTINE_IDS.indexOf(externalId);
  const nextExternalId =
    currentIndex >= 0 ? MOCK_PROGRAM_ROUTINE_IDS[currentIndex + 1] : undefined;

  let nextRoutine: RoutineLoaderData["nextRoutine"] = null;
  if (nextExternalId) {
    const next = await queryClient.ensureQueryData(
      convexQuery(api.routines.getByExternalId, { externalId: nextExternalId }),
    );
    if (next) {
      nextRoutine = { externalId: next.id, name: next.name };
    }
  }

  return {
    routine,
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
    nextRoutine,
  };
}
