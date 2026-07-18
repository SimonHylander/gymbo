export function getWorkoutElapsedMs(
  startedAt: number,
  now = Date.now()
): number {
  return Math.max(0, now - startedAt);
}

export function formatWorkoutElapsed(elapsedMs: number): string {
  const totalSeconds = Math.floor(elapsedMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function formatWorkoutElapsedMinutes(elapsedMs: number): string {
  const totalSeconds = Math.max(0, elapsedMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const secondTenths = Math.floor((totalSeconds % 60) * 10);
  const wholeSeconds = Math.floor(secondTenths / 10);
  const tenth = secondTenths % 10;

  return `${minutes}:${String(wholeSeconds).padStart(2, "0")}.${tenth}`;
}
