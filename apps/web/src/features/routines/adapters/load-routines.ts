import type { QueryClient } from "@tanstack/react-query";

import type { RoutinesListData } from "@/features/routines/domain/types";
import { routinesQueries } from "@/features/routines/adapters/query-keys";

export async function loadRoutines(
  queryClient: QueryClient
): Promise<RoutinesListData> {
  return queryClient.ensureQueryData(routinesQueries.list());
}
