export function routineDetailStats(exercises: { sets: unknown[] }[]) {
  return {
    exerciseCount: exercises.length,
    totalSets: exercises.reduce((n, e) => n + e.sets.length, 0),
  };
}

export function routineExerciseNamePreview(
  exercises: { name: string }[],
  maxNames = 3
): { preview: string; remaining: number } {
  const preview = exercises
    .slice(0, maxNames)
    .map((e) => e.name)
    .join(" · ");
  const remaining = Math.max(0, exercises.length - maxNames);
  return { preview, remaining };
}
