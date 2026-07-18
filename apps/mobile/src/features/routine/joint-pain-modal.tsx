import type { Id } from "@workspace/backend/convex/_generated/dataModel"
import {
  JOINT_PAIN_OPTIONS,
  type JointPainLevel,
} from "@workspace/domain/routine/domain/joint-pain"
import { useState } from "react"
import { Alert, Modal, Pressable, Text, View } from "react-native"

import {
  useRoutineSession,
  useWorkoutSync,
} from "./routine-session-provider"

/**
 * Minimal single-exercise joint pain check-in. Opens when the domain store
 * flags an exercise as just completed; the full multi-exercise wizard from
 * the web is a post-v1 addition.
 */
export function JointPainModal() {
  const open = useRoutineSession((state) => state.jointPainCheckInOpen)
  const exerciseId = useRoutineSession(
    (state) => state.jointPainCheckInExerciseId
  )
  const workoutId = useRoutineSession((state) => state.workoutId)
  const workoutExerciseIds = useRoutineSession(
    (state) => state.workoutExerciseIds
  )
  const exercise = useRoutineSession((state) =>
    state.routine.exercises.find((entry) => entry.id === exerciseId)
  )
  const closeJointPainCheckIn = useRoutineSession(
    (state) => state.closeJointPainCheckIn
  )
  const advanceAfterJointPainCheckIn = useRoutineSession(
    (state) => state.advanceAfterJointPainCheckIn
  )
  const sync = useWorkoutSync()
  const [saving, setSaving] = useState(false)

  if (!open || !exerciseId || !workoutId || !exercise) {
    return null
  }

  const workoutExerciseId = workoutExerciseIds[exerciseId]

  const save = async (level: JointPainLevel) => {
    if (!sync.current || !workoutExerciseId || saving) return
    setSaving(true)
    try {
      await sync.current.recordJointPain({
        workoutId: workoutId as Id<"workouts">,
        workoutExerciseId: workoutExerciseId as Id<"workoutExercises">,
        jointPainLevel: level,
      })
      advanceAfterJointPainCheckIn(exerciseId)
    } catch {
      Alert.alert("Sync error", "Failed to save joint pain check-in")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal transparent animationType="slide" visible onRequestClose={closeJointPainCheckIn}>
      <View className="flex-1 justify-end bg-black/40">
        <View className="rounded-t-3xl bg-white p-6 pb-10">
          <Text className="text-lg font-bold text-neutral-900">
            How did your joints feel?
          </Text>
          <Text className="mt-0.5 text-sm text-neutral-500">
            {exercise.name}
          </Text>

          <View className="mt-4 gap-2">
            {JOINT_PAIN_OPTIONS.map((option) => (
              <Pressable
                key={option.level}
                disabled={saving}
                className="rounded-xl border border-neutral-200 px-4 py-3 active:bg-neutral-50"
                onPress={() => void save(option.level)}
              >
                <Text className="text-base font-semibold text-neutral-900">
                  {option.label}
                </Text>
                <Text className="mt-0.5 text-xs text-neutral-500">
                  {option.description}
                </Text>
              </Pressable>
            ))}
          </View>

          <Pressable
            className="mt-4 items-center py-2"
            onPress={closeJointPainCheckIn}
          >
            <Text className="text-sm font-medium text-neutral-400">Skip</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  )
}
