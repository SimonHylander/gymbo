import { createStore, type StoreApi } from "zustand";

import type { WorkoutMutations } from "@/features/routine/adapters/sync-workout";
import {
  addSet,
  applyPreviousToSet,
  canCompleteSet,
  createInitialLogs,
  deleteSet,
  isExerciseComplete,
  markExerciseComplete,
  toggleSetComplete,
  updateSetField,
} from "@/features/routine/domain/exercise-log";
import {
  openJointPainForExercise,
  openJointPainWizard,
  shouldPromptJointPainAfterExerciseComplete,
} from "@/features/routine/domain/joint-pain-session";
import { getRestDuration } from "@/features/routine/domain/rest-timer";
import {
  adjustRestTimer as adjustRestTimerState,
  resolveRestTimerAfterSetToggle,
  type RestTimerState,
} from "@/features/routine/domain/rest-timer-session";
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
import {
  createWorkoutSessionSync,
  type SyncState,
  type WorkoutSessionSync,
} from "@/features/routine/sync/workout-session-sync";
import type { Id } from "../../../../convex/_generated/dataModel";

export type { SyncState };

function genId() {
  return Math.random().toString(36).slice(2);
}

export type { RestTimerState };

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
  syncState: SyncState;
  restTimer: RestTimerState | null;
  jointPainCheckInOpen: boolean;
  /** When set, check-in is for one exercise just completed. When null, wizard walks all exercises. */
  jointPainCheckInExerciseId: string | null;

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
  toggleSetComplete: (exerciseId: string, setIdx: number) => void;
  skipRestTimer: () => void;
  adjustRestTimer: (deltaSeconds: number) => void;
  sendNote: () => void;
  setNoteDraft: (text: string) => void;
  startWorkout: () => Promise<void>;
  stopWorkout: () => Promise<void>;
  openJointPainCheckIn: () => void;
  openJointPainCheckInForExercise: (exerciseId: string) => void;
  closeJointPainCheckIn: () => void;
  advanceAfterJointPainCheckIn: (exerciseId: string) => void;
  flushPendingSync: () => void;
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

export type RoutineSessionStoreOptions = {
  onSyncError?: (message: string) => void;
  onWorkoutAutoStarted?: () => void;
};

export function createRoutineSessionStore(
  routine: Routine,
  ongoingSession: WorkoutSessionSnapshot | null,
  syncRef: WorkoutSyncRef,
  options?: RoutineSessionStoreOptions | ((message: string) => void)
): StoreApi<RoutineSessionStore> {
  const { onSyncError, onWorkoutAutoStarted } =
    typeof options === "function"
      ? { onSyncError: options, onWorkoutAutoStarted: undefined }
      : (options ?? {});

  const initialHydration = ongoingSession
    ? hydrateFromSession(ongoingSession)
    : null;

  let sessionSync: WorkoutSessionSync;

  const switchExercise = (
    exerciseId: string,
    get: () => RoutineSessionStore,
    set: (partial: Partial<RoutineSessionStore>) => void
  ) => {
    const state = get();
    if (exerciseId === state.activeExerciseId) return;

    const previousExerciseId = state.activeExerciseId;
    const currentIndex = getExerciseIndex(state.routine, previousExerciseId);

    set({
      activeExerciseId: exerciseId,
      switchDirection: getSwitchDirection(state.routine, currentIndex, exerciseId),
    });

    sessionSync.onExerciseSwitch(previousExerciseId, exerciseId);
  };

  const promptJointPainAfterExerciseComplete = (
    exerciseId: string,
    get: () => RoutineSessionStore,
    set: (partial: Partial<RoutineSessionStore>) => void
  ) => {
    const state = get();
    if (
      !shouldPromptJointPainAfterExerciseComplete({
        jointPainCheckInOpen: state.jointPainCheckInOpen,
        workoutStatus: state.workoutStatus,
      })
    ) {
      return;
    }

    void sessionSync.ensureWorkoutStarted().then(() => {
      const current = get();
      if (current.workoutStatus !== "ongoing" || !current.workoutId) {
        return;
      }

      set(openJointPainForExercise(exerciseId));
    });
  };

  return createStore<RoutineSessionStore>((set, get) => {
    if (!sessionSync) {
      sessionSync = createWorkoutSessionSync({
        getState: get,
        setState: set,
        getMutations: () => syncRef.current,
        routineExternalId: routine.id,
        hydrateFromSession,
        onError: onSyncError,
        onWorkoutAutoStarted,
      });
    }

    return {
      routine,
      exerciseLogs:
        initialHydration?.exerciseLogs ?? createInitialLogs(routine.exercises),
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
      syncState:
        initialHydration?.workoutStatus === "ongoing" ? "saved" : "idle",
      restTimer: null,
      jointPainCheckInOpen: false,
      jointPainCheckInExerciseId: null,

      selectExercise: (exerciseId) => switchExercise(exerciseId, get, set),

      goToPreviousExercise: () => {
        const state = get();
        const currentIndex = getExerciseIndex(
          state.routine,
          state.activeExerciseId
        );
        const previousExercise = state.routine.exercises[currentIndex - 1];
        if (previousExercise) {
          switchExercise(previousExercise.id, get, set);
        }
      },

      goToNextExercise: () => {
        const state = get();
        const currentIndex = getExerciseIndex(
          state.routine,
          state.activeExerciseId
        );
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

        const persist = () => sessionSync.persistLog(exerciseId, true);

        if (value.trim()) {
          void sessionSync.ensureWorkoutStarted().then(persist);
        } else {
          persist();
        }
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

        sessionSync.applyPrevious(exerciseId, setIdx);
      },

      addSet: (exerciseId) => {
        set((state) => ({
          exerciseLogs: {
            ...state.exerciseLogs,
            [exerciseId]: addSet(state.exerciseLogs[exerciseId]),
          },
        }));

        sessionSync.addSet(exerciseId);
      },

      deleteSet: (exerciseId, setIdx) => {
        set((state) => ({
          exerciseLogs: {
            ...state.exerciseLogs,
            [exerciseId]: deleteSet(state.exerciseLogs[exerciseId], setIdx),
          },
        }));

        sessionSync.removeSet(exerciseId, setIdx);
      },

      toggleSetComplete: (exerciseId, setIdx) => {
        const state = get();
        const log = state.exerciseLogs[exerciseId];
        const setEntry = log?.sets[setIdx];
        const wasCompleted = setEntry?.status === "completed";

        const applyToggle = () => {
          const currentState = get();
          const currentLog = currentState.exerciseLogs[exerciseId];
          const wasExerciseComplete = isExerciseComplete(currentLog);

          let updatedLog = toggleSetComplete(currentLog, setIdx);

          if (isExerciseComplete(updatedLog) && !wasExerciseComplete) {
            updatedLog = markExerciseComplete(updatedLog);
          }

          set((current) => ({
            exerciseLogs: {
              ...current.exerciseLogs,
              [exerciseId]: updatedLog,
            },
          }));

          const exercise = currentState.routine.exercises.find(
            (entry) => entry.id === exerciseId
          );
          const restTimer = resolveRestTimerAfterSetToggle({
            timer: get().restTimer,
            exerciseId,
            setIndex: setIdx,
            wasCompleted,
            canStartRest: Boolean(setEntry && canCompleteSet(setEntry)),
            restSeconds: getRestDuration(exercise?.restSeconds),
            now: Date.now(),
          });

          if (restTimer !== get().restTimer) {
            set({ restTimer });
          }

          sessionSync.persistLog(exerciseId, false);

          if (isExerciseComplete(updatedLog) && !wasExerciseComplete) {
            promptJointPainAfterExerciseComplete(exerciseId, get, set);
          }
        };

        if (!wasCompleted) {
          void sessionSync.ensureWorkoutStarted().then(applyToggle);
        } else {
          applyToggle();
        }
      },

      skipRestTimer: () => set({ restTimer: null }),

      adjustRestTimer: (deltaSeconds) => {
        const state = get();
        if (!state.restTimer) return;

        set({
          restTimer: adjustRestTimerState(
            state.restTimer,
            deltaSeconds,
            Date.now()
          ),
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

      startWorkout: () => sessionSync.startWorkout(),

      flushPendingSync: () => {
        const state = get();
        if (state.workoutStatus !== "ongoing") return;
        sessionSync.flushAllLogs();
      },

      stopWorkout: async () => {
        set({ restTimer: null });
        try {
          await sessionSync.stopWorkout();
        } catch {
          // Error surfaced via onSyncError in the port.
        }
      },

      openJointPainCheckIn: () => set(openJointPainWizard()),

      openJointPainCheckInForExercise: (exerciseId) =>
        set(openJointPainForExercise(exerciseId)),

      closeJointPainCheckIn: () =>
        set({ jointPainCheckInOpen: false, jointPainCheckInExerciseId: null }),

      advanceAfterJointPainCheckIn: (exerciseId) => {
        set({ jointPainCheckInOpen: false, jointPainCheckInExerciseId: null });

        const state = get();
        const nextId = getNextIncompleteId(state.routine, state.exerciseLogs);
        if (nextId && nextId !== exerciseId) {
          switchExercise(nextId, get, set);
        }
      },
    };
  });
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
  | "toggleSetComplete"
  | "skipRestTimer"
  | "adjustRestTimer"
  | "sendNote"
  | "setNoteDraft"
  | "startWorkout"
>;
