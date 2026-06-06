import { useQuery } from "@tanstack/react-query";

import { routinesQueries } from "@/features/routines/adapters/query-keys";

export function useRoutinesList() {
  return useQuery(routinesQueries.list());
}

export function useRoutinesPage() {
  const listQuery = useRoutinesList();

  return {
    list: listQuery.data,
    isListLoading: listQuery.isLoading,
  };
}
