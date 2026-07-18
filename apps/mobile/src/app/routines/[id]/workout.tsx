import { api } from "@workspace/backend/convex/_generated/api"
import type { Routine } from "@workspace/domain/routine/domain/types"
import {
  getExerciseIndex,
} from "@workspace/domain/routine/domain/session-selectors"
import { Button } from "@workspace/native-ui/button"
import { EmptyState } from "@workspace/native-ui/empty-state"
import { useQuery } from "convex/react"
import { useKeepAwake } from "expo-keep-awake"
import { Stack, useLocalSearchParams, useRouter } from "expo-router"
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"

import { ExerciseCard } from "@/features/routine/exercise-card"
import { JointPainModal } from "@/features/routine/joint-pain-modal"
import { RestTimerBar } from "@/features/routine/rest-timer-bar"
import {
  RoutineSessionProvider,
  useRoutineActions,
  useRoutineSession,
  useWorkoutSessionMeta,
} from "@/features/routine/routine-session-provider"
import { useRestTimerNotification } from "@/features/routine/use-rest-timer-notification"

export default function WorkoutScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()

  const routine = useQuery(api.routines.getByExternalId, { externalId: id })
  const ongoingSession = useQuery(api.workouts.getOngoingForRoutine, {
    routineExternalId: id,
  })

  if (routine === undefined || ongoingSession === undefined) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator />
      </View>
    )
  }

  if (routine === null || routine.exercises.length === 0) {
    return (
      <EmptyState
        title="Nothing to log"
        description="This routine has no exercises."
      />
    )
  }

  const domainRoutine: Routine = {
    id: routine.id,
    name: routine.name,
    exercises: routine.exercises,
  }

  return (
    <RoutineSessionProvider
      routine={domainRoutine}
      ongoingSession={ongoingSession}
    >
      <Stack.Screen options={{ title: routine.name, headerBackTitle: "Back" }} />
      <WorkoutSession />
    </RoutineSessionProvider>
  )
}

function WorkoutSession() {
  useKeepAwake()
  useRestTimerNotification()

  const router = useRouter()
  const routine = useRoutineSession((state) => state.routine)
  const activeExerciseId = useRoutineSession((state) => state.activeExerciseId)
  const exerciseLogs = useRoutineSession((state) => state.exerciseLogs)
  const { selectExercise, goToPreviousExercise, goToNextExercise } =
    useRoutineActions()
  const {
    workoutStatus,
    syncState,
    isStartingWorkout,
    isStoppingWorkout,
    startWorkout,
    stopWorkout,
  } = useWorkoutSessionMeta()

  const activeExercise =
    routine.exercises.find((exercise) => exercise.id === activeExerciseId) ??
    routine.exercises[0]
  const activeIndex = getExerciseIndex(routine, activeExercise.id)
  const completedCount = routine.exercises.filter(
    (exercise) => exerciseLogs[exercise.id]?.completed
  ).length

  const finishWorkout = () => {
    Alert.alert("Finish workout?", "Your logged sets will be saved.", [
      { text: "Keep going", style: "cancel" },
      {
        text: "Finish",
        style: "destructive",
        onPress: () => {
          void stopWorkout().then((completed) => {
            if (completed) {
              router.back()
            }
          })
        },
      },
    ])
  }

  return (
    <SafeAreaView className="flex-1 bg-neutral-50" edges={["bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <View className="flex-row items-center justify-between px-4 py-2">
          <Text className="text-sm text-neutral-500">
            {completedCount}/{routine.exercises.length} exercises done
          </Text>
          <Text className="text-xs uppercase tracking-wide text-neutral-400">
            {workoutStatus === "ongoing"
              ? syncState === "saving"
                ? "Saving…"
                : "Saved"
              : workoutStatus}
          </Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="max-h-12 grow-0"
          contentContainerClassName="px-4 gap-2 items-center"
        >
          {routine.exercises.map((exercise, index) => {
            const isActive = exercise.id === activeExercise.id
            const isDone = exerciseLogs[exercise.id]?.completed
            return (
              <Pressable
                key={exercise.id}
                onPress={() => selectExercise(exercise.id)}
                className={`rounded-full px-3 py-1.5 ${
                  isActive
                    ? "bg-neutral-900"
                    : isDone
                      ? "bg-emerald-100"
                      : "bg-neutral-200"
                }`}
              >
                <Text
                  className={`text-xs font-semibold ${
                    isActive
                      ? "text-white"
                      : isDone
                        ? "text-emerald-700"
                        : "text-neutral-600"
                  }`}
                >
                  {index + 1}. {exercise.name}
                </Text>
              </Pressable>
            )
          })}
        </ScrollView>

        <ScrollView
          className="flex-1"
          contentContainerClassName="p-4 pb-40 gap-4"
          keyboardShouldPersistTaps="handled"
        >
          <ExerciseCard exercise={activeExercise} />

          <View className="flex-row gap-3">
            <Button
              label="Previous"
              variant="secondary"
              className="flex-1"
              disabled={activeIndex <= 0}
              onPress={goToPreviousExercise}
            />
            <Button
              label="Next"
              variant="secondary"
              className="flex-1"
              disabled={activeIndex >= routine.exercises.length - 1}
              onPress={goToNextExercise}
            />
          </View>

          {workoutStatus === "pending" ? (
            <Button
              label="Start workout"
              loading={isStartingWorkout}
              onPress={() => void startWorkout()}
            />
          ) : workoutStatus === "ongoing" ? (
            <Button
              label="Finish workout"
              variant="destructive"
              loading={isStoppingWorkout}
              onPress={finishWorkout}
            />
          ) : (
            <Button
              label="Workout complete — back to routine"
              variant="secondary"
              onPress={() => router.back()}
            />
          )}
        </ScrollView>

        <RestTimerBar />
        <JointPainModal />
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
