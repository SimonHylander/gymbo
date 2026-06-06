import { useMutation } from "convex/react";
import { useNavigate, useRouter } from "@tanstack/react-router";
import {
  createContext,
  use,
  useCallback,
  useEffect,
  useMemo,
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
import { WorkoutJointPainFlow } from "@/features/routine/components/workout-joint-pain-flow";
import type {
  Routine,
  WorkoutSessionSnapshot,
} from "@/features/routine/domain/types";
import {
  createWorkoutLifecycle,
  type NextRoutine,
  type WorkoutLifecycleContextValue,
} from "@/features/routine/domain/workout-lifecycle";
import {
  createRoutineSessionStore,
  type RoutineSessionActions,
  type RoutineSessionStore,
  type WorkoutSyncRef,
} from "@/features/routine/store/create-routine-session-store";
import { toast } from "@/components/chat/toast";

const RoutineStoreContext =
  createContext<StoreApi<RoutineSessionStore> | null>(null);

const WorkoutLifecycleContext =
  createContext<WorkoutLifecycleContextValue | null>(null);

type RoutineMeta = {
  scrollRef: RefObject<HTMLDivElement | null>;
  inputRef: RefObject<HTMLTextAreaElement | null>;
  scrollToBottom: () => void;
};

const RoutineMetaContext = createContext<RoutineMeta | null>(null);

type RoutineJointPainCheckInProps = {
  recordJointPain: WorkoutMutations["recordJointPain"];
  onComplete: () => Promise<void>;
  onCancel: () => void;
};

function RoutineJointPainCheckIn({
  recordJointPain,
  onComplete,
  onCancel,
}: RoutineJointPainCheckInProps) {
  const store = use(RoutineStoreContext);
  if (!store) return null;

  const open = useStore(store, (state) => state.jointPainCheckInOpen);
  const targetExerciseId = useStore(
    store,
    (state) => state.jointPainCheckInExerciseId
  );
  const workoutId = useStore(store, (state) => state.workoutId);
  const routine = useStore(store, (state) => state.routine);
  const workoutExerciseIds = useStore(
    store,
    (state) => state.workoutExerciseIds
  );
  const advanceAfterJointPainCheckIn = useStore(
    store,
    (state) => state.advanceAfterJointPainCheckIn
  );

  return (
    <WorkoutJointPainFlow
      open={open}
      targetExerciseId={targetExerciseId}
      workoutId={workoutId}
      exercises={routine.exercises}
      workoutExerciseIds={workoutExerciseIds}
      recordJointPain={recordJointPain}
      onComplete={onComplete}
      onSingleExerciseSaved={advanceAfterJointPainCheckIn}
      onCancel={onCancel}
    />
  );
}

type RoutineProviderProps = {
  routine: Routine;
  ongoingSession: WorkoutSessionSnapshot | null;
  nextRoutine: NextRoutine | null;
  children: ReactNode;
};

export function RoutineProvider({
  routine,
  ongoingSession,
  nextRoutine,
  children,
}: RoutineProviderProps) {
  const storeRef = useRef<StoreApi<RoutineSessionStore> | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const syncRef = useRef<WorkoutMutations | null>(null) as WorkoutSyncRef;
  const navigate = useNavigate();
  const router = useRouter();

  const startMutation = useMutation(api.workouts.start);
  const completeMutation = useMutation(api.workouts.complete);
  const setActiveExerciseMutation = useMutation(api.workouts.setActiveExercise);
  const updateLogMutation = useMutation(api.workoutExercises.updateLog);
  const addSetMutation = useMutation(api.workoutExercises.addSet);
  const removeSetMutation = useMutation(api.workoutExercises.removeSet);
  const applyPreviousToSetMutation = useMutation(
    api.workoutExercises.applyPreviousToSet
  );
  const recordJointPainMutation = useMutation(
    api.exerciseBiofeedback.recordJointPain
  );

  syncRef.current = createWorkoutSync({
    startMutation,
    completeMutation,
    setActiveExerciseMutation,
    updateLogMutation,
    addSetMutation,
    removeSetMutation,
    applyPreviousToSetMutation,
    recordJointPainMutation,
  });

  const onSyncError = useCallback((message: string) => {
    toast({ type: "error", description: message });
  }, []);

  const onWorkoutAutoStarted = useCallback(() => {
    toast({
      type: "success",
      description: "Workout started — sets are saving",
    });
  }, []);

  if (!storeRef.current) {
    storeRef.current = createRoutineSessionStore(
      routine,
      ongoingSession,
      syncRef,
      { onSyncError, onWorkoutAutoStarted }
    );
  }

  useEffect(() => {
    const store = storeRef.current;
    if (!store) return;

    const flushOnHide = () => {
      store.getState().flushPendingSync();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        flushOnHide();
      }
    };

    window.addEventListener("pagehide", flushOnHide);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      flushOnHide();
      window.removeEventListener("pagehide", flushOnHide);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const scrollToBottom = useCallback(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, []);

  const navigateAfterFinish = useCallback(async () => {
    if (nextRoutine) {
      await navigate({
        to: "/routines/$id",
        params: { id: nextRoutine.externalId },
      });
      await router.invalidate();
    }
  }, [navigate, nextRoutine, router]);

  const navigateHome = useCallback(async () => {
    await navigate({ to: "/routines" });
  }, [navigate]);

  const lifecycle = useMemo(
    () =>
      createWorkoutLifecycle({
        getStore: () => storeRef.current,
        navigateAfterFinish,
        navigateHome,
      }),
    [navigateAfterFinish, navigateHome]
  );

  const lifecycleValue = useMemo<WorkoutLifecycleContextValue>(
    () => ({
      ...lifecycle,
      nextRoutine,
    }),
    [lifecycle, nextRoutine]
  );

  return (
    <RoutineStoreContext value={storeRef.current}>
      <WorkoutLifecycleContext value={lifecycleValue}>
        <RoutineMetaContext value={{ scrollRef, inputRef, scrollToBottom }}>
          <RoutineJointPainCheckIn
            recordJointPain={(args) => {
              const sync = syncRef.current;
              if (!sync) {
                throw new Error("Workout sync not initialized");
              }
              return sync.recordJointPain(args);
            }}
            onComplete={lifecycle.completeJointPainCheckIn}
            onCancel={lifecycle.cancelJointPainCheckIn}
          />
          {children}
        </RoutineMetaContext>
      </WorkoutLifecycleContext>
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
      toggleSetComplete: state.toggleSetComplete,
      skipRestTimer: state.skipRestTimer,
      adjustRestTimer: state.adjustRestTimer,
      sendNote: state.sendNote,
      setNoteDraft: state.setNoteDraft,
      startWorkout: state.startWorkout,
    }))
  );
}

export function useExerciseLogging() {
  const store = useRoutineStore();

  return useStore(
    store,
    useShallow((state) => ({
      routine: state.routine,
      activeExerciseId: state.activeExerciseId,
      exerciseLogs: state.exerciseLogs,
      updateSet: state.updateSet,
      applyPrevious: state.applyPrevious,
      addSet: state.addSet,
      deleteSet: state.deleteSet,
      toggleSetComplete: state.toggleSetComplete,
    }))
  );
}

export function useRestTimerControls() {
  const store = useRoutineStore();

  return useStore(
    store,
    useShallow((state) => ({
      restTimer: state.restTimer,
      workoutStatus: state.workoutStatus,
      skipRestTimer: state.skipRestTimer,
      adjustRestTimer: state.adjustRestTimer,
    }))
  );
}

export function useWorkoutSessionMeta() {
  const store = useRoutineStore();

  return useStore(
    store,
    useShallow((state) => ({
      workoutStatus: state.workoutStatus,
      syncState: state.syncState,
      workoutStartedAt: state.workoutStartedAt,
      workoutEndedAt: state.workoutEndedAt,
      isStartingWorkout: state.isStartingWorkout,
      isStoppingWorkout: state.isStoppingWorkout,
      startWorkout: state.startWorkout,
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

export function useWorkoutLifecycle(): WorkoutLifecycleContextValue {
  const lifecycle = use(WorkoutLifecycleContext);
  if (!lifecycle) {
    throw new Error("useWorkoutLifecycle must be used within Routine.Provider");
  }
  return lifecycle;
}
