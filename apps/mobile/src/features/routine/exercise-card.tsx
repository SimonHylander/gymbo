import { formatRepTargetLabel } from "@workspace/domain/lib/rep-target"
import type { Exercise } from "@workspace/domain/routine/domain/types"
import { Badge } from "@workspace/native-ui/badge"
import { Card } from "@workspace/native-ui/card"
import { Pressable, Text, View } from "react-native"

import {
  useRoutineActions,
  useRoutineSession,
} from "./routine-session-provider"
import { SetRow } from "./set-row"

type ExerciseCardProps = {
  exercise: Exercise
}

export function ExerciseCard({ exercise }: ExerciseCardProps) {
  const log = useRoutineSession(
    (state) => state.exerciseLogs[exercise.id]
  )
  const { updateSet, applyPrevious, addSet, deleteSet, toggleSetComplete } =
    useRoutineActions()

  const repTarget = formatRepTargetLabel({
    reps: exercise.reps,
    repRangeMin: exercise.repRangeMin,
    repRangeMax: exercise.repRangeMax,
  })

  return (
    <Card>
      <View className="flex-row items-start justify-between gap-2">
        <Text className="flex-1 text-lg font-semibold text-neutral-900">
          {exercise.name}
        </Text>
        {log?.completed ? <Badge label="Done" tone="success" /> : null}
      </View>
      {repTarget ? (
        <Text className="mt-0.5 text-sm text-neutral-500">
          Target: {repTarget}
        </Text>
      ) : null}
      {exercise.notes ? (
        <Text className="mt-1 text-sm italic text-neutral-400">
          {exercise.notes}
        </Text>
      ) : null}

      <View className="mt-3 flex-row items-center gap-2 px-2">
        <Text className="w-7 text-center text-xs font-medium text-neutral-400">
          Set
        </Text>
        <Text className="w-20 text-center text-xs font-medium text-neutral-400">
          Previous
        </Text>
        <Text className="flex-1 text-center text-xs font-medium text-neutral-400">
          Weight
        </Text>
        <Text className="flex-1 text-center text-xs font-medium text-neutral-400">
          Reps
        </Text>
        <View className="w-9" />
      </View>

      <View className="mt-1 gap-1">
        {(log?.sets ?? []).map((set, index) => (
          <SetRow
            key={index}
            index={index}
            set={set}
            onUpdate={(field, value) =>
              updateSet(exercise.id, index, field, value)
            }
            onApplyPrevious={() => applyPrevious(exercise.id, index)}
            onToggleComplete={() => toggleSetComplete(exercise.id, index)}
            onDelete={() => deleteSet(exercise.id, index)}
          />
        ))}
      </View>

      <Pressable
        className="mt-3 items-center rounded-xl border border-dashed border-neutral-300 py-2.5 active:bg-neutral-50"
        onPress={() => addSet(exercise.id)}
      >
        <Text className="text-sm font-medium text-neutral-500">+ Add set</Text>
      </Pressable>
    </Card>
  )
}
