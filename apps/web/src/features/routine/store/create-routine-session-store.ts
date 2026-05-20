import { createStore, type StoreApi } from "zustand";

import type { WorkoutMutations } from "@/features/routine/adapters/sync-workout";
import {
  addSet,
  applyPreviousToSet,
  canCompleteSet,
  createInitialLogs,
  deleteSet,
  toggleExerciseComplete,
  toggleSetComplete,
  updateSetField,
} from "@/features/routine/domain/exercise-log";
import { getRestDuration } from "@/features/routine/domain/rest-timer";
import {
  getExerciseIndex,
  getNextIncompleteId,
  getSwitchDirection,
} from "@/features/routine/domain/session-selectors";
import type {
  ExerciseLogState,
  Routine,
  SetField,
  UserNote,
  WorkoutSessionSnapshot,
  WorkoutStatus,
} from "@/features/routine/domain/types";
import type { Id } from "../../../../convex/_generated/dataModel";

function genId() {
  return Math.random().toString(36).slice(2);
}

const LOG_SYNC_DEBOUNCE_MS = 300;

export type RestTimerState = {
  exerciseId: string;
  setIndex: number;
  totalSeconds: number;
  endsAt: number;
};

export type RoutineSessionStore = {
  routine: Routine;
  exerciseLogs: Record<string, ExerciseLogState>;
  activeExerciseId: string;
  switchDirection: -1 | 0 | 1;
  notes: UserNote[];
  noteDraft: string;
  workoutId: Id<"workouts"> | null;
  workoutExerciseIds: Record<string, Id<"workoutExercises">>;
  workoutStatus: WorkoutStatus;
  workoutStartedAt: number | null;
  workoutEndedAt: number | null;
  isStartingWorkout: boolean;
  isStoppingWorkout: boolean;
  restTimer: RestTimerState | null;

  selectExercise: (exerciseId: string) => void;
  goToPreviousExercise: () => void;
  goToNextExercise: () => void;
  updateSet: (
    exerciseId: string,
    setIdx: number,
    field: SetField,
    value: string
  ) => void;
  applyPrevious: (exerciseId: string, setIdx: number) => void;
  addSet: (exerciseId: string) => void;
  deleteSet: (exerciseId: string, setIdx: number) => void;
  toggleExerciseComplete: (exerciseId: string) => void;
  toggleSetComplete: (exerciseId: string, setIdx: number) => void;
  skipRestTimer: () => void;
  adjustRestTimer: (deltaSeconds: number) => void;
  sendNote: () => void;
  setNoteDraft: (text: string) => void;
  startWorkout: () => Promise<void>;
  stopWorkout: () => Promise<void>;
};

export type WorkoutSyncRef = {
  current: WorkoutMutations | null;
};

function hydrateFromSession(
  session: WorkoutSessionSnapshot
): Pick<
  RoutineSessionStore,
  | "workoutId"
  | "workoutExerciseIds"
  | "workoutStatus"
  | "workoutStartedAt"
  | "workoutEndedAt"
  | "exerciseLogs"
  | "activeExerciseId"
> {
  return {
    workoutId: session.workoutId as Id<"workouts">,
    workoutExerciseIds: Object.fromEntries(
      Object.entries(session.workoutExerciseIds).map(([k, v]) => [
        k,
        v as Id<"workoutExercises">,
      ])
    ),
    workoutStatus: session.status,
    workoutStartedAt: session.startedAt,
    workoutEndedAt: session.endedAt,
    exerciseLogs: session.exerciseLogs,
    activeExerciseId: session.activeExerciseExternalId,
  };
}

export function createRoutineSessionStore(
  routine: Routine,
  ongoingSession: WorkoutSessionSnapshot | null,
  syncRef: WorkoutSyncRef,
  onSyncError?: (message: string) => void
): StoreApi<RoutineSessionStore> {
  const debounceTimers = new Map<string, ReturnType<typeof setTimeout>>();

  const flushLogSync = (exerciseId: string, get: () => RoutineSessionStore) => {
    const existing = debounceTimers.get(exerciseId);
    if (existing) {
      clearTimeout(existing);
      debounceTimers.delete(exerciseId);
    }

    const state = get();
    const workoutExerciseId = state.workoutExerciseIds[exerciseId];
    const log = state.exerciseLogs[exerciseId];
    const sync = syncRef.current;

    if (!workoutExerciseId || !log || !sync || state.workoutStatus !== "ongoing") {
      return;
    }

    void sync.updateLog({ workoutExerciseId, log }).catch(() => {
      onSyncError?.("Failed to save set changes");
    });
  };

  const scheduleLogSync = (exerciseId: string, get: () => RoutineSessionStore) => {
    const existing = debounceTimers.get(exerciseId);
    if (existing) clearTimeout(existing);

    debounceTimers.set(
      exerciseId,
      setTimeout(() => {
        debounceTimers.delete(exerciseId);
        flushLogSync(exerciseId, get);
      }, LOG_SYNC_DEBOUNCE_MS)
    );
  };

  const persistLog = (
    exerciseId: string,
    get: () => RoutineSessionStore,
    debounce: boolean
  ) => {
    if (debounce) {
      scheduleLogSync(exerciseId, get);
    } else {
      flushLogSync(exerciseId, get);
    }
  };

  const switchExercise = (
    exerciseId: string,
    get: () => RoutineSessionStore,
    set: (partial: Partial<RoutineSessionStore>) => void
  ) => {
    const state = get();
    if (exerciseId === state.activeExerciseId) return;

    flushLogSync(state.activeExerciseId, get);

    const currentIndex = getExerciseIndex(state.routine, state.activeExerciseId);
    set({
      activeExerciseId: exerciseId,
      switchDirection: getSwitchDirection(state.routine, currentIndex, exerciseId),
    });

    const sync = syncRef.current;
    if (sync && state.workoutId && state.workoutStatus === "ongoing") {
      void sync
        .setActiveExercise({
          workoutId: state.workoutId,
          exerciseExternalId: exerciseId,
        })
        .catch(() => {
          onSyncError?.("Failed to save active exercise");
        });
    }
  };

  const initialHydration = ongoingSession
    ? hydrateFromSession(ongoingSession)
    : null;

  return createStore<RoutineSessionStore>((set, get) => ({
    routine,
    exerciseLogs: initialHydration?.exerciseLogs ?? createInitialLogs(routine.exercises),
    activeExerciseId:
      initialHydration?.activeExerciseId ?? routine.exercises[0]?.id ?? "",
    switchDirection: 0,
    notes: [],
    noteDraft: "",
    workoutId: initialHydration?.workoutId ?? null,
    workoutExerciseIds: initialHydration?.workoutExerciseIds ?? {},
    workoutStatus: initialHydration?.workoutStatus ?? "pending",
    workoutStartedAt: initialHydration?.workoutStartedAt ?? null,
    workoutEndedAt: initialHydration?.workoutEndedAt ?? null,
    isStartingWorkout: false,
    isStoppingWorkout: false,
    restTimer: null,

    selectExercise: (exerciseId) => switchExercise(exerciseId, get, set),

    goToPreviousExercise: () => {
      const state = get();
      const currentIndex = getExerciseIndex(state.routine, state.activeExerciseId);
      const previousExercise = state.routine.exercises[currentIndex - 1];
      if (previousExercise) {
        switchExercise(previousExercise.id, get, set);
      }
    },

    goToNextExercise: () => {
      const state = get();
      const currentIndex = getExerciseIndex(state.routine, state.activeExerciseId);
      const nextExercise = state.routine.exercises[currentIndex + 1];
      if (nextExercise) {
        switchExercise(nextExercise.id, get, set);
      }
    },

    updateSet: (exerciseId, setIdx, field, value) => {
      set((state) => ({
        exerciseLogs: {
          ...state.exerciseLogs,
          [exerciseId]: updateSetField(
            state.exerciseLogs[exerciseId],
            setIdx,
            field,
            value
          ),
        },
      }));
      persistLog(exerciseId, get, true);
    },

    applyPrevious: (exerciseId, setIdx) => {
      set((state) => ({
        exerciseLogs: {
          ...state.exerciseLogs,
          [exerciseId]: applyPreviousToSet(
            state.exerciseLogs[exerciseId],
            setIdx
          ),
        },
      }));

      const state = get();
      const workoutExerciseId = state.workoutExerciseIds[exerciseId];
      const sync = syncRef.current;

      if (sync && workoutExerciseId && state.workoutStatus === "ongoing") {
        void sync
          .applyPreviousToSet({ workoutExerciseId, setIndex: setIdx })
          .catch(() => {
            onSyncError?.("Failed to apply previous set");
          });
      } else {
        persistLog(exerciseId, get, false);
      }
    },

    addSet: (exerciseId) => {
      set((state) => ({
        exerciseLogs: {
          ...state.exerciseLogs,
          [exerciseId]: addSet(state.exerciseLogs[exerciseId]),
        },
      }));

      const state = get();
      const workoutExerciseId = state.workoutExerciseIds[exerciseId];
      const sync = syncRef.current;

      if (sync && workoutExerciseId && state.workoutStatus === "ongoing") {
        void sync.addSet({ workoutExerciseId }).catch(() => {
          onSyncError?.("Failed to add set");
        });
      }
    },

    deleteSet: (exerciseId, setIdx) => {
      set((state) => ({
        exerciseLogs: {
          ...state.exerciseLogs,
          [exerciseId]: deleteSet(state.exerciseLogs[exerciseId], setIdx),
        },
      }));

      const state = get();
      const workoutExerciseId = state.workoutExerciseIds[exerciseId];
      const sync = syncRef.current;

      if (sync && workoutExerciseId && state.workoutStatus === "ongoing") {
        void sync.removeSet({ workoutExerciseId, setIndex: setIdx }).catch(() => {
          onSyncError?.("Failed to remove set");
        });
      }
    },

    toggleExerciseComplete: (exerciseId) => {
      const state = get();
      const wasCompleted = state.exerciseLogs[exerciseId]?.completed;

      set((current) => ({
        exerciseLogs: {
          ...current.exerciseLogs,
          [exerciseId]: toggleExerciseComplete(
            current.exerciseLogs[exerciseId]
          ),
        },
      }));

      persistLog(exerciseId, get, false);

      if (!wasCompleted) {
        const nextId = getNextIncompleteId(get().routine, get().exerciseLogs);
        if (nextId && nextId !== exerciseId) {
          queueMicrotask(() => get().selectExercise(nextId));
        }
      }
    },

    toggleSetComplete: (exerciseId, setIdx) => {
      const state = get();
      const log = state.exerciseLogs[exerciseId];
      const setEntry = log?.sets[setIdx];
      const wasCompleted = setEntry?.status === "completed";

      set((current) => ({
        exerciseLogs: {
          ...current.exerciseLogs,
          [exerciseId]: toggleSetComplete(
            current.exerciseLogs[exerciseId],
            setIdx
          ),
        },
      }));

      if (!wasCompleted && setEntry && canCompleteSet(setEntry)) {
        const exercise = state.routine.exercises.find(
          (entry) => entry.id === exerciseId
        );
        if (exercise) {
          const totalSeconds = getRestDuration(exercise.restSeconds);
          set({
            restTimer: {
              exerciseId,
              setIndex: setIdx,
              totalSeconds,
              endsAt: Date.now() + totalSeconds * 1000,
            },
          });
        }
      } else if (wasCompleted) {
        const { restTimer } = get();
        if (
          restTimer?.exerciseId === exerciseId &&
          restTimer.setIndex === setIdx
        ) {
          set({ restTimer: null });
        }
      }

      persistLog(exerciseId, get, false);
    },

    skipRestTimer: () => set({ restTimer: null }),

    adjustRestTimer: (deltaSeconds) => {
      const state = get();
      if (!state.restTimer) return;

      const now = Date.now();
      const endsAt = Math.max(
        now,
        state.restTimer.endsAt + deltaSeconds * 1000
      );

      set({
        restTimer: {
          ...state.restTimer,
          endsAt,
        },
      });
    },

    sendNote: () => {
      const text = get().noteDraft.trim();
      if (!text) return;

      set((state) => ({
        notes: [...state.notes, { id: genId(), text }],
        noteDraft: "",
      }));
    },

    setNoteDraft: (text) => set({ noteDraft: text }),

    startWorkout: async () => {
      const state = get();
      if (state.workoutStartedAt !== null || state.isStartingWorkout) return;
      if (state.workoutStatus === "completed") return;

      const sync = syncRef.current;
      if (!sync) return;

      set({ isStartingWorkout: true });
      try {
        const session = await sync.start({ routineExternalId: routine.id });
        set({
          ...hydrateFromSession(session),
          isStartingWorkout: false,
        });
      } catch {
        onSyncError?.("Failed to start workout");
        set({ isStartingWorkout: false });
      }
    },

    stopWorkout: async () => {
      const state = get();
      if (!state.workoutId || state.isStoppingWorkout) return;
      if (state.workoutStatus === "completed") return;

      const sync = syncRef.current;
      if (!sync) return;

      flushLogSync(state.activeExerciseId, get);

      set({ isStoppingWorkout: true });
      try {
        const session = await sync.complete({ workoutId: state.workoutId });
        set({
          ...hydrateFromSession(session),
          isStoppingWorkout: false,
        });
      } catch {
        onSyncError?.("Failed to end workout");
        set({ isStoppingWorkout: false });
      }
    },
  }));
}

export type RoutineSessionActions = Pick<
  RoutineSessionStore,
  | "selectExercise"
  | "goToPreviousExercise"
  | "goToNextExercise"
  | "updateSet"
  | "applyPrevious"
  | "addSet"
  | "deleteSet"
  | "toggleExerciseComplete"
  | "toggleSetComplete"
  | "skipRestTimer"
  | "adjustRestTimer"
  | "sendNote"
  | "setNoteDraft"
  | "startWorkout"
  | "stopWorkout"
>;
