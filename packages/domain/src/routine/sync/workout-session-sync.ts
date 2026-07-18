import type { WorkoutMutations } from "./workout-mutations";
import type {
  ExerciseLogState,
  WorkoutSessionSnapshot,
  WorkoutStatus,
} from "../domain/types";
import type { Id } from "@workspace/backend/convex/_generated/dataModel";

export const LOG_SYNC_DEBOUNCE_MS = 300;

export type SyncState = "idle" | "saving" | "saved" | "error";

export type WorkoutSessionSyncState = {
  workoutId: Id<"workouts"> | null;
  workoutExerciseIds: Record<string, Id<"workoutExercises">>;
  workoutStatus: WorkoutStatus;
  workoutStartedAt: number | null;
  workoutEndedAt: number | null;
  exerciseLogs: Record<string, ExerciseLogState>;
  activeExerciseId: string;
  isStartingWorkout: boolean;
  isStoppingWorkout: boolean;
  syncState: SyncState;
};

export type WorkoutSessionSyncHydration = Pick<
  WorkoutSessionSyncState,
  | "workoutId"
  | "workoutExerciseIds"
  | "workoutStatus"
  | "workoutStartedAt"
  | "workoutEndedAt"
  | "exerciseLogs"
  | "activeExerciseId"
>;

export type WorkoutSessionSyncDeps = {
  getState: () => WorkoutSessionSyncState;
  setState: (partial: Partial<WorkoutSessionSyncState>) => void;
  getMutations: () => WorkoutMutations | null;
  routineExternalId: string;
  hydrateFromSession: (
    session: WorkoutSessionSnapshot
  ) => WorkoutSessionSyncHydration;
  onError?: (message: string) => void;
  onWorkoutAutoStarted?: () => void;
};

export type WorkoutSessionSync = {
  persistLog: (exerciseId: string, debounce: boolean) => void;
  flushLog: (exerciseId: string) => void;
  flushAllLogs: () => Promise<void>;
  onExerciseSwitch: (
    previousExerciseId: string,
    nextExerciseId: string
  ) => void;
  ensureWorkoutStarted: () => Promise<void>;
  startWorkout: () => Promise<void>;
  stopWorkout: () => Promise<boolean>;
  applyPrevious: (exerciseId: string, setIndex: number) => void;
  addSet: (exerciseId: string) => void;
  removeSet: (exerciseId: string, setIndex: number) => void;
};

export function createWorkoutSessionSync(
  deps: WorkoutSessionSyncDeps
): WorkoutSessionSync {
  const {
    getState,
    setState,
    getMutations,
    routineExternalId,
    hydrateFromSession,
    onError,
    onWorkoutAutoStarted,
  } = deps;

  const debounceTimers = new Map<string, ReturnType<typeof setTimeout>>();
  const inFlightWrites = new Set<Promise<boolean>>();
  let startWorkoutPromise: Promise<void> | null = null;

  const trackInFlight = <T>(write: Promise<T>): Promise<T> => {
    const settled = write.then(
      () => true,
      () => false
    );
    inFlightWrites.add(settled);
    void settled.then(() => {
      inFlightWrites.delete(settled);
    });
    return write;
  };

  const drainInFlightWrites = async (): Promise<boolean> => {
    let allSucceeded = true;
    while (inFlightWrites.size > 0) {
      const results = await Promise.all([...inFlightWrites]);
      if (results.includes(false)) {
        allSucceeded = false;
      }
    }
    return allSucceeded;
  };

  const flushLog = (exerciseId: string) => {
    const existing = debounceTimers.get(exerciseId);
    if (existing) {
      clearTimeout(existing);
      debounceTimers.delete(exerciseId);
    }

    const state = getState();
    const workoutExerciseId = state.workoutExerciseIds[exerciseId];
    const log = state.exerciseLogs[exerciseId];
    const sync = getMutations();

    if (
      !workoutExerciseId ||
      !log ||
      !sync ||
      state.workoutStatus !== "ongoing"
    ) {
      return;
    }

    setState({ syncState: "saving" });

    void trackInFlight(sync.updateLog({ workoutExerciseId, log }))
      .then(() => {
        setState({ syncState: "saved" });
      })
      .catch(() => {
        setState({ syncState: "error" });
        onError?.("Failed to save set changes");
      });
  };

  const schedulePersist = (exerciseId: string) => {
    const existing = debounceTimers.get(exerciseId);
    if (existing) clearTimeout(existing);

    setState({ syncState: "saving" });

    debounceTimers.set(
      exerciseId,
      setTimeout(() => {
        debounceTimers.delete(exerciseId);
        flushLog(exerciseId);
      }, LOG_SYNC_DEBOUNCE_MS)
    );
  };

  const flushAndDrain = (): Promise<boolean> => {
    for (const exerciseId of [...debounceTimers.keys()]) {
      flushLog(exerciseId);
    }
    return drainInFlightWrites();
  };

  const flushAllLogs = async (): Promise<void> => {
    await flushAndDrain();
  };

  const persistLog = (exerciseId: string, debounce: boolean) => {
    if (debounce) {
      schedulePersist(exerciseId);
    } else {
      flushLog(exerciseId);
    }
  };

  const persistActiveExercise = (exerciseId: string) => {
    const state = getState();
    const sync = getMutations();

    if (sync && state.workoutId && state.workoutStatus === "ongoing") {
      void trackInFlight(
        sync.setActiveExercise({
          workoutId: state.workoutId,
          exerciseExternalId: exerciseId,
        })
      ).catch(() => {
        onError?.("Failed to save active exercise");
      });
    }
  };

  const startWorkoutInternal = async (notifyAutoStarted: boolean) => {
    const state = getState();
    if (state.workoutStatus !== "pending") return;
    if (state.isStartingWorkout && startWorkoutPromise) {
      await startWorkoutPromise;
      return;
    }

    const sync = getMutations();
    if (!sync) return;

    startWorkoutPromise = (async () => {
      setState({ isStartingWorkout: true });
      try {
        const session = await sync.start({ routineExternalId });
        setState({
          ...hydrateFromSession(session),
          isStartingWorkout: false,
          syncState: "saved",
        });
        if (notifyAutoStarted) {
          onWorkoutAutoStarted?.();
        }
      } catch {
        onError?.("Failed to start workout");
        setState({ isStartingWorkout: false });
      } finally {
        startWorkoutPromise = null;
      }
    })();

    await startWorkoutPromise;
  };

  const canMutateExercise = (
    exerciseId: string
  ): { sync: WorkoutMutations; workoutExerciseId: Id<"workoutExercises"> } | null => {
    const state = getState();
    const sync = getMutations();
    const workoutExerciseId = state.workoutExerciseIds[exerciseId];

    if (!sync || !workoutExerciseId || state.workoutStatus !== "ongoing") {
      return null;
    }

    return { sync, workoutExerciseId };
  };

  return {
    persistLog,
    flushLog,
    flushAllLogs,

    onExerciseSwitch: (previousExerciseId, nextExerciseId) => {
      flushLog(previousExerciseId);
      persistActiveExercise(nextExerciseId);
    },

    ensureWorkoutStarted: () => startWorkoutInternal(true),

    startWorkout: async () => {
      const state = getState();
      if (state.workoutStartedAt !== null || state.isStartingWorkout) return;
      if (state.workoutStatus === "completed") return;
      if (state.workoutStatus === "ongoing") return;

      await startWorkoutInternal(false);
    },

    stopWorkout: async () => {
      const state = getState();
      if (!state.workoutId || state.isStoppingWorkout) return false;
      if (state.workoutStatus === "completed") return true;

      const sync = getMutations();
      if (!sync) return false;

      setState({ isStoppingWorkout: true });

      const drained = await flushAndDrain();
      if (!drained) {
        setState({ isStoppingWorkout: false });
        return false;
      }

      try {
        const session = await sync.complete({ workoutId: state.workoutId });
        setState({
          ...hydrateFromSession(session),
          isStoppingWorkout: false,
          syncState: "saved",
        });
        return true;
      } catch {
        onError?.("Failed to end workout");
        setState({ isStoppingWorkout: false });
        return false;
      }
    },

    applyPrevious: (exerciseId, setIndex) => {
      const mutation = canMutateExercise(exerciseId);

      if (mutation) {
        void trackInFlight(
          mutation.sync.applyPreviousToSet({
            workoutExerciseId: mutation.workoutExerciseId,
            setIndex,
          })
        ).catch(() => {
          onError?.("Failed to apply previous set");
        });
      } else {
        persistLog(exerciseId, false);
      }
    },

    addSet: (exerciseId) => {
      const mutation = canMutateExercise(exerciseId);

      if (mutation) {
        void trackInFlight(
          mutation.sync.addSet({ workoutExerciseId: mutation.workoutExerciseId })
        ).catch(() => {
          onError?.("Failed to add set");
        });
      }
    },

    removeSet: (exerciseId, setIndex) => {
      const mutation = canMutateExercise(exerciseId);

      if (mutation) {
        void trackInFlight(
          mutation.sync.removeSet({
            workoutExerciseId: mutation.workoutExerciseId,
            setIndex,
          })
        ).catch(() => {
          onError?.("Failed to remove set");
        });
      }
    },
  };
}
