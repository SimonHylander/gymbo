import * as Haptics from "expo-haptics"
import * as Notifications from "expo-notifications"
import { useEffect, useRef } from "react"

import { useRoutineSession } from "./routine-session-provider"

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: false,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})

/**
 * JS timers suspend in the background, so the rest countdown is backed by a
 * local notification scheduled at the timer's endsAt timestamp. Foreground
 * UI reconciles from endsAt directly (the timer state is timestamp-based),
 * so nothing needs re-syncing on foreground.
 */
export function useRestTimerNotification() {
  const restTimer = useRoutineSession((state) => state.restTimer)
  const scheduledIdRef = useRef<string | null>(null)
  const permissionRequestedRef = useRef(false)

  useEffect(() => {
    let cancelled = false

    const clearScheduled = async () => {
      if (scheduledIdRef.current) {
        await Notifications.cancelScheduledNotificationAsync(
          scheduledIdRef.current
        ).catch(() => {})
        scheduledIdRef.current = null
      }
    }

    const schedule = async () => {
      if (!restTimer) {
        await clearScheduled()
        return
      }

      if (!permissionRequestedRef.current) {
        permissionRequestedRef.current = true
        await Notifications.requestPermissionsAsync().catch(() => {})
      }

      await clearScheduled()
      if (cancelled || restTimer.endsAt <= Date.now()) {
        return
      }

      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: "Rest over",
          body: "Time for your next set.",
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: new Date(restTimer.endsAt),
        },
      }).catch(() => null)

      if (id) {
        if (cancelled) {
          await Notifications.cancelScheduledNotificationAsync(id).catch(
            () => {}
          )
        } else {
          scheduledIdRef.current = id
        }
      }
    }

    void schedule()

    return () => {
      cancelled = true
      void clearScheduled()
    }
  }, [restTimer])
}

export function restTimerEndedHaptic() {
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
}

export function setCompletedHaptic() {
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
}
