import { useQuery } from "convex/react";
import { useMemo } from "react";

import { api } from "@workspace/backend/convex/_generated/api";
import type { Id } from "@workspace/backend/convex/_generated/dataModel";
import type { WorkoutMutations } from "@workspace/domain/routine/sync/workout-mutations";
import { JointPainCheckInDialog } from "@/features/routine/components/joint-pain-check-in-dialog";
import type { JointPainLevel } from "@workspace/domain/routine/domain/joint-pain";
import type { Exercise } from "@workspace/domain/routine/domain/types";
import { useJointPainSession } from "@/features/routine/store/use-joint-pain-session";

type WorkoutJointPainFlowProps = {
  open: boolean;
  targetExerciseId: string | null;
  workoutId: Id<"workouts"> | null;
  exercises: Exercise[];
  workoutExerciseIds: Record<string, Id<"workoutExercises">>;
  recordJointPain: WorkoutMutations["recordJointPain"];
  onComplete: () => Promise<void>;
  onSingleExerciseSaved: (exerciseId: string) => void;
  onCancel: () => void;
};

export function WorkoutJointPainFlow({
  open,
  targetExerciseId,
  workoutId,
  exercises,
  workoutExerciseIds,
  recordJointPain,
  onComplete,
  onSingleExerciseSaved,
  onCancel,
}: WorkoutJointPainFlowProps) {
  const existingFeedbackRaw = useQuery(
    api.exerciseBiofeedback.listByWorkout,
    workoutId && open ? { workoutId } : "skip"
  );

  const existingFeedback = useMemo(
    () =>
      existingFeedbackRaw?.map((entry) => ({
        workoutExerciseId: entry.workoutExerciseId as string,
        jointPainLevel: entry.jointPainLevel as JointPainLevel,
      })),
    [existingFeedbackRaw]
  );

  const session = useJointPainSession({
    open,
    targetExerciseId,
    workoutId,
    exercises,
    workoutExerciseIds,
    existingFeedback,
    recordJointPain,
    onComplete,
    onSingleExerciseSaved,
  });

  if (!session.shouldRender || !session.currentExercise) {
    return null;
  }

  return (
    <JointPainCheckInDialog
      key={session.currentExercise.id}
      open={open}
      exerciseName={session.currentExercise.name}
      exerciseIndex={session.displayExerciseIndex}
      exerciseCount={session.exerciseCount}
      initialLevel={session.initialLevel}
      isSaving={session.isSaving}
      onOpenChange={() => undefined}
      onSave={(level) => void session.save(level)}
      onCancel={onCancel}
    />
  );
}
