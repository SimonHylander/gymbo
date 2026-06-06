import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

import {
  formatRestCountdown,
  getRestProgress,
} from "@/features/routine/domain/rest-timer";
import {
  useRestTimerControls,
} from "@/features/routine/store/routine-session-context";
import { Button } from "@/components/ui/button";

const restTimerTransition = {
  duration: 0.2,
  ease: [0.32, 0.72, 0, 1] as const,
};

const restTimerVariants = {
  hidden: { y: "100%", opacity: 0.94 },
  visible: { y: 0, opacity: 1 },
};

export function RestTimerBar() {
  const { restTimer, workoutStatus, skipRestTimer, adjustRestTimer } =
    useRestTimerControls();
  const shouldReduceMotion = useReducedMotion();
  const [now, setNow] = useState(() => Date.now());
  const dismissTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!restTimer) return;

    setNow(Date.now());
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [restTimer]);

  useEffect(() => {
    if (!restTimer) {
      if (dismissTimeoutRef.current) {
        clearTimeout(dismissTimeoutRef.current);
        dismissTimeoutRef.current = null;
      }
      return;
    }

    const remainingMs = Math.max(0, restTimer.endsAt - now);

    if (remainingMs > 0) {
      if (dismissTimeoutRef.current) {
        clearTimeout(dismissTimeoutRef.current);
        dismissTimeoutRef.current = null;
      }
      return;
    }

    if (dismissTimeoutRef.current) return;

    dismissTimeoutRef.current = setTimeout(() => {
      dismissTimeoutRef.current = null;
      skipRestTimer();
    }, 400);

    return () => {
      if (dismissTimeoutRef.current) {
        clearTimeout(dismissTimeoutRef.current);
        dismissTimeoutRef.current = null;
      }
    };
  }, [restTimer, now, skipRestTimer]);

  const remainingMs = restTimer
    ? Math.max(0, restTimer.endsAt - now)
    : 0;
  const totalMs = restTimer ? restTimer.totalSeconds * 1000 : 0;
  const progress = getRestProgress(remainingMs, totalMs);
  const countdown = formatRestCountdown(remainingMs);
  const showRestTimer = restTimer !== null && workoutStatus !== "completed";

  return (
    <AnimatePresence initial={false}>
      {showRestTimer && restTimer && (
        <motion.div
          key="rest-timer"
          role="region"
          aria-label="Rest timer"
          initial={shouldReduceMotion ? false : "hidden"}
          animate={shouldReduceMotion ? undefined : "visible"}
          exit={shouldReduceMotion ? undefined : "hidden"}
          variants={restTimerVariants}
          transition={
            shouldReduceMotion ? { duration: 0 } : restTimerTransition
          }
          className="shrink-0 border-t border-border/40 bg-background py-3"
        >
          <div className="mx-auto w-full max-w-2xl px-4">
            <div className="overflow-hidden rounded-xl border border-border/50 bg-card shadow-sm">
              <div
                className="h-0.5 bg-muted"
                role="progressbar"
                aria-valuenow={Math.round(progress * restTimer.totalSeconds)}
                aria-valuemin={0}
                aria-valuemax={restTimer.totalSeconds}
                aria-label="Rest progress"
              >
                <div
                  className="h-full bg-primary"
                  style={{ width: `${progress * 100}%` }}
                />
              </div>

              <div className="flex flex-col items-center gap-3 p-4">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  Rest
                </p>

                <p
                  className="text-4xl font-semibold tabular-nums tracking-tight text-foreground"
                  aria-live="polite"
                  aria-atomic="true"
                >
                  {countdown}
                </p>

                <div className="grid w-full grid-cols-3 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-sm font-medium"
                    onClick={() => adjustRestTimer(-15)}
                    aria-label="Remove 15 seconds"
                  >
                    −15
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-sm font-medium"
                    onClick={() => adjustRestTimer(15)}
                    aria-label="Add 15 seconds"
                  >
                    +15
                  </Button>
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    className="text-sm font-medium"
                    onClick={skipRestTimer}
                    aria-label="Skip rest"
                  >
                    Skip
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function RestTimer() {
  return <RestTimerBar />;
}
