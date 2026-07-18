import type { SetEntry } from "@workspace/domain/routine/domain/types"
import { Pressable, Text, TextInput, View } from "react-native"

import { setCompletedHaptic } from "./use-rest-timer-notification"

type SetRowProps = {
  index: number
  set: SetEntry
  onUpdate: (field: "weight" | "reps", value: string) => void
  onApplyPrevious: () => void
  onToggleComplete: () => void
  onDelete: () => void
}

export function SetRow({
  index,
  set,
  onUpdate,
  onApplyPrevious,
  onToggleComplete,
  onDelete,
}: SetRowProps) {
  const completed = set.status === "completed"

  return (
    <View
      className={`flex-row items-center gap-2 rounded-xl px-2 py-1.5 ${
        completed ? "bg-emerald-50" : ""
      }`}
    >
      <Pressable
        onLongPress={onDelete}
        className="w-7 items-center"
        accessibilityLabel={`Set ${index + 1}. Long-press to delete.`}
      >
        <Text className="text-sm font-semibold text-neutral-500">
          {index + 1}
        </Text>
      </Pressable>

      <Pressable className="w-20" onPress={onApplyPrevious}>
        <Text className="text-center text-xs text-neutral-400" numberOfLines={1}>
          {set.previous || "—"}
        </Text>
      </Pressable>

      <TextInput
        className="flex-1 rounded-lg border border-neutral-200 bg-white px-2 py-1.5 text-center text-base"
        keyboardType="decimal-pad"
        placeholder="0"
        value={set.weight}
        onChangeText={(value) => onUpdate("weight", value)}
      />
      <TextInput
        className="flex-1 rounded-lg border border-neutral-200 bg-white px-2 py-1.5 text-center text-base"
        keyboardType="number-pad"
        placeholder="0"
        value={set.reps}
        onChangeText={(value) => onUpdate("reps", value)}
      />

      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: completed }}
        onPress={() => {
          if (!completed) {
            setCompletedHaptic()
          }
          onToggleComplete()
        }}
        className={`h-9 w-9 items-center justify-center rounded-lg ${
          completed ? "bg-emerald-500" : "bg-neutral-100"
        }`}
      >
        <Text
          className={`text-base font-bold ${
            completed ? "text-white" : "text-neutral-400"
          }`}
        >
          ✓
        </Text>
      </Pressable>
    </View>
  )
}
