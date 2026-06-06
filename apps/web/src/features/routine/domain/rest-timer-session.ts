export type RestTimerState = {
  exerciseId: string;
  setIndex: number;
  totalSeconds: number;
  endsAt: number;
};

export type ResolveRestTimerAfterSetToggleInput = {
  timer: RestTimerState | null;
  exerciseId: string;
  setIndex: number;
  wasCompleted: boolean;
  canStartRest: boolean;
  restSeconds: number;
  now: number;
};

export function resolveRestTimerAfterSetToggle(
  input: ResolveRestTimerAfterSetToggleInput
): RestTimerState | null {
  const {
    timer,
    exerciseId,
    setIndex,
    wasCompleted,
    canStartRest,
    restSeconds,
    now,
  } = input;

  if (!wasCompleted && canStartRest) {
    return {
      exerciseId,
      setIndex,
      totalSeconds: restSeconds,
      endsAt: now + restSeconds * 1000,
    };
  }

  if (
    wasCompleted &&
    timer?.exerciseId === exerciseId &&
    timer.setIndex === setIndex
  ) {
    return null;
  }

  return timer;
}

export function adjustRestTimer(
  timer: RestTimerState,
  deltaSeconds: number,
  now: number
): RestTimerState {
  return {
    ...timer,
    endsAt: Math.max(now, timer.endsAt + deltaSeconds * 1000),
  };
}
