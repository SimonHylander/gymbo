import { useQuery } from "@tanstack/react-query";

import { routinesQueries } from "@/features/routines/adapters/query-keys";

export function useRoutineDetail(externalId: string | undefined) {
  const detailQuery = useQuery({
    ...routinesQueries.detail(externalId ?? ""),
    enabled: Boolean(externalId),
  });

  const ongoingQuery = useQuery({
    ...routinesQueries.ongoing(externalId ?? ""),
    enabled: Boolean(externalId),
  });

  return {
    detail: detailQuery.data ?? null,
    isLoading: detailQuery.isLoading,
    hasOngoingWorkout: ongoingQuery.data !== null && ongoingQuery.data !== undefined,
    isOngoingLoading: ongoingQuery.isLoading,
  };
}
