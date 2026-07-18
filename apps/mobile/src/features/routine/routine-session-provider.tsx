import { api } from "@workspace/backend/convex/_generated/api"
import type {
  Routine,
  WorkoutSessionSnapshot,
} from "@workspace/domain/routine/domain/types"
import {
  createRoutineSessionStore,
  type RoutineSessionActions,
  type RoutineSessionStore,
  type WorkoutSyncRef,
} from "@workspace/domain/routine/store/create-routine-session-store"
import {
  createWorkoutSync,
  type WorkoutMutations,
} from "@workspace/domain/routine/sync/workout-mutations"
import { useMutation } from "convex/react"
import {
  createContext,
  use,
  useEffect,
  useRef,
  type ReactNode,
} from "react"
import { Alert, AppState } from "react-native"
import { useStore, type StoreApi } from "zustand"
import { useShallow } from "zustand/react/shallow"

const RoutineStoreContext = createContext<StoreApi<RoutineSessionStore> | null>(
  null
)
const WorkoutSyncContext = createContext<WorkoutSyncRef | null>(null)

type RoutineSessionProviderProps = {
  routine: Routine
  ongoingSession: WorkoutSessionSnapshot | null
  children: ReactNode
}

export function RoutineSessionProvider({
  routine,
  ongoingSession,
  children,
}: RoutineSessionProviderProps) {
  const storeRef = useRef<StoreApi<RoutineSessionStore> | null>(null)
  const syncRef = useRef<WorkoutMutations | null>(null) as WorkoutSyncRef

  const startMutation = useMutation(api.workouts.start)
  const completeMutation = useMutation(api.workouts.complete)
  const setActiveExerciseMutation = useMutation(api.workouts.setActiveExercise)
  const updateLogMutation = useMutation(api.workoutExercises.updateLog)
  const addSetMutation = useMutation(api.workoutExercises.addSet)
  const removeSetMutation = useMutation(api.workoutExercises.removeSet)
  const applyPreviousToSetMutation = useMutation(
    api.workoutExercises.applyPreviousToSet
  )
  const recordJointPainMutation = useMutation(
    api.exerciseBiofeedback.recordJointPain
  )

  syncRef.current = createWorkoutSync({
    startMutation,
    completeMutation,
    setActiveExerciseMutation,
    updateLogMutation,
    addSetMutation,
    removeSetMutation,
    applyPreviousToSetMutation,
    recordJointPainMutation,
  })

  if (!storeRef.current) {
    storeRef.current = createRoutineSessionStore(routine, ongoingSession, syncRef, {
      onSyncError: (message) => Alert.alert("Sync error", message),
    })
  }

  // Mobile counterpart of the web provider's pagehide/visibilitychange flush.
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "background" || state === "inactive") {
        storeRef.current?.getState().flushInFlightSync()
      }
    })
    return () => {
      storeRef.current?.getState().flushInFlightSync()
      subscription.remove()
    }
  }, [])

  return (
    <RoutineStoreContext value={storeRef.current}>
      <WorkoutSyncContext value={syncRef}>{children}</WorkoutSyncContext>
    </RoutineStoreContext>
  )
}

function useRoutineStore() {
  const store = use(RoutineStoreContext)
  if (!store) {
    throw new Error(
      "useRoutineSession must be used within RoutineSessionProvider"
    )
  }
  return store
}

export function useWorkoutSync(): WorkoutSyncRef {
  const sync = use(WorkoutSyncContext)
  if (!sync) {
    throw new Error("useWorkoutSync must be used within RoutineSessionProvider")
  }
  return sync
}

export function useRoutineSession<T>(
  selector: (state: RoutineSessionStore) => T
): T {
  return useStore(useRoutineStore(), selector)
}

export function useRoutineActions(): RoutineSessionActions {
  const store = useRoutineStore()

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
  )
}

export function useWorkoutSessionMeta() {
  const store = useRoutineStore()

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
      stopWorkout: state.stopWorkout,
    }))
  )
}
