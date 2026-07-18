import {
  formatRestCountdown,
  getRestProgress,
} from "@workspace/domain/routine/domain/rest-timer"
import { useEffect, useRef, useState } from "react"
import { Pressable, Text, View } from "react-native"

import {
  useRoutineActions,
  useRoutineSession,
} from "./routine-session-provider"
import { restTimerEndedHaptic } from "./use-rest-timer-notification"

export function RestTimerBar() {
  const restTimer = useRoutineSession((state) => state.restTimer)
  const { skipRestTimer, adjustRestTimer } = useRoutineActions()
  const [now, setNow] = useState(() => Date.now())
  const firedRef = useRef(false)

  useEffect(() => {
    if (!restTimer) {
      firedRef.current = false
      return
    }
    const interval = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(interval)
  }, [restTimer])

  useEffect(() => {
    if (!restTimer) return
    const remaining = restTimer.endsAt - now
    if (remaining <= 0 && !firedRef.current) {
      firedRef.current = true
      restTimerEndedHaptic()
      skipRestTimer()
    }
  }, [restTimer, now, skipRestTimer])

  if (!restTimer) {
    return null
  }

  const remainingMs = Math.max(0, restTimer.endsAt - now)
  const progress = getRestProgress(remainingMs, restTimer.totalSeconds * 1000)

  return (
    <View className="absolute inset-x-4 bottom-4 rounded-2xl bg-neutral-900 p-4 shadow-lg">
      <View className="flex-row items-center justify-between">
        <Text className="text-sm font-medium text-neutral-400">Rest</Text>
        <Text className="text-2xl font-bold tabular-nums text-white">
          {formatRestCountdown(remainingMs)}
        </Text>
      </View>
      <View className="mt-3 h-1.5 overflow-hidden rounded-full bg-neutral-700">
        <View
          className="h-full rounded-full bg-emerald-400"
          style={{ width: `${progress * 100}%` }}
        />
      </View>
      <View className="mt-3 flex-row justify-between">
        <Pressable
          className="rounded-lg bg-neutral-800 px-4 py-2 active:opacity-70"
          onPress={() => adjustRestTimer(-15)}
        >
          <Text className="font-semibold text-white">-15s</Text>
        </Pressable>
        <Pressable
          className="rounded-lg bg-neutral-800 px-4 py-2 active:opacity-70"
          onPress={skipRestTimer}
        >
          <Text className="font-semibold text-white">Skip</Text>
        </Pressable>
        <Pressable
          className="rounded-lg bg-neutral-800 px-4 py-2 active:opacity-70"
          onPress={() => adjustRestTimer(15)}
        >
          <Text className="font-semibold text-white">+15s</Text>
        </Pressable>
      </View>
    </View>
  )
}
