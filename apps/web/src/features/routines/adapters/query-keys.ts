import { convexQuery } from "@convex-dev/react-query";

import { api } from "../../../../convex/_generated/api";

export const routinesQueries = {
  list: () => convexQuery(api.programs.listWithRoutines, {}),
  detail: (externalId: string) =>
    convexQuery(api.routines.getByExternalId, { externalId }),
  ongoing: (externalId: string) =>
    convexQuery(api.workouts.getOngoingForRoutine, {
      routineExternalId: externalId,
    }),
  catalog: (search?: string) =>
    convexQuery(api.exercises.list, { search: search || undefined }),
};
