import { useMutation } from "convex/react";
import {
  createContext,
  use,
  useCallback,
  useRef,
  type ReactNode,
  type RefObject,
} from "react";
import { useStore, type StoreApi } from "zustand";
import { useShallow } from "zustand/react/shallow";

import { api } from "../../../../convex/_generated/api";
import {
  createWorkoutSync,
  type WorkoutMutations,
} from "@/features/routine/adapters/sync-workout";
import type {
  Routine,
  WorkoutSessionSnapshot,
} from "@/features/routine/domain/types";
import {
  createRoutineSessionStore,
  type RoutineSessionActions,
  type RoutineSessionStore,
  type WorkoutSyncRef,
} from "@/features/routine/store/create-routine-session-store";
import { toast } from "@/components/chat/toast";

const RoutineStoreContext =
  createContext<StoreApi<RoutineSessionStore> | null>(null);

type RoutineMeta = {
  scrollRef: RefObject<HTMLDivElement | null>;
  inputRef: RefObject<HTMLTextAreaElement | null>;
  scrollToBottom: () => void;
};

const RoutineMetaContext = createContext<RoutineMeta | null>(null);

type RoutineProviderProps = {
  routine: Routine;
  ongoingSession: WorkoutSessionSnapshot | null;
  children: ReactNode;
};

export function RoutineProvider({
  routine,
  ongoingSession,
  children,
}: RoutineProviderProps) {
  const storeRef = useRef<StoreApi<RoutineSessionStore> | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const syncRef = useRef<WorkoutMutations | null>(null) as WorkoutSyncRef;

  const startMutation = useMutation(api.workouts.start);
  const completeMutation = useMutation(api.workouts.complete);
  const setActiveExerciseMutation = useMutation(api.workouts.setActiveExercise);
  const updateLogMutation = useMutation(api.workoutExercises.updateLog);
  const addSetMutation = useMutation(api.workoutExercises.addSet);
  const removeSetMutation = useMutation(api.workoutExercises.removeSet);
  const applyPreviousToSetMutation = useMutation(
    api.workoutExercises.applyPreviousToSet
  );

  syncRef.current = createWorkoutSync({
    startMutation,
    completeMutation,
    setActiveExerciseMutation,
    updateLogMutation,
    addSetMutation,
    removeSetMutation,
    applyPreviousToSetMutation,
  });

  const onSyncError = useCallback((message: string) => {
    toast({ type: "error", description: message });
  }, []);

  if (!storeRef.current) {
    storeRef.current = createRoutineSessionStore(
      routine,
      ongoingSession,
      syncRef,
      onSyncError
    );
  }

  const scrollToBottom = useCallback(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, []);

  return (
    <RoutineStoreContext value={storeRef.current}>
      <RoutineMetaContext
        value={{ scrollRef, inputRef, scrollToBottom }}
      >
        {children}
      </RoutineMetaContext>
    </RoutineStoreContext>
  );
}

function useRoutineStore() {
  const store = use(RoutineStoreContext);
  if (!store) {
    throw new Error("useRoutineSession must be used within Routine.Provider");
  }
  return store;
}

export function useRoutineSession<T>(
  selector: (state: RoutineSessionStore) => T
): T {
  const store = useRoutineStore();
  return useStore(store, selector);
}

export function useRoutineActions(): RoutineSessionActions {
  const store = useRoutineStore();

  return useStore(
    store,
    useShallow((state) => ({
      selectExercise: state.selectExercise,
      goToPreviousExercise: state.goToPreviousExercise,
      goToNextExercise: state.goToNextExercise,
      updateSet: state.updateSet,
      applyPrevious: state.applyPrevious,
      addSet: state.addSet,
      deleteSet: state.deleteSet,
      toggleExerciseComplete: state.toggleExerciseComplete,
      toggleSetComplete: state.toggleSetComplete,
      skipRestTimer: state.skipRestTimer,
      adjustRestTimer: state.adjustRestTimer,
      sendNote: state.sendNote,
      setNoteDraft: state.setNoteDraft,
      startWorkout: state.startWorkout,
      stopWorkout: state.stopWorkout,
    }))
  );
}

export function useRoutineMeta() {
  const meta = use(RoutineMetaContext);
  if (!meta) {
    throw new Error("useRoutineMeta must be used within Routine.Provider");
  }
  return meta;
}
