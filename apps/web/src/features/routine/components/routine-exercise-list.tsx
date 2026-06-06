import { useReducedMotion } from "framer-motion";
import { useEffect, useRef } from "react";

import { ExerciseCard } from "@/features/routine/components/exercise-card/exercise-card";
import {
  useRoutineActions,
  useRoutineSession,
} from "@/features/routine/store/routine-session-context";

export function RoutineExerciseList() {
  const routine = useRoutineSession((state) => state.routine);
  const activeExerciseId = useRoutineSession((state) => state.activeExerciseId);
  const { selectExercise } = useRoutineActions();
  const shouldReduceMotion = useReducedMotion();
  const skipInitialScroll = useRef(true);

  useEffect(() => {
    if (skipInitialScroll.current) {
      skipInitialScroll.current = false;
      return;
    }

    const target = document.getElementById(
      `routine-exercise-${activeExerciseId}`
    );
    if (!target) return;

    target.scrollIntoView({
      behavior: shouldReduceMotion ? "auto" : "smooth",
      block: "start",
    });
  }, [activeExerciseId, shouldReduceMotion]);

  return (
    <div className="flex flex-col gap-4">
      {routine.exercises.map((exercise) => (
        <section
          key={exercise.id}
          id={`routine-exercise-${exercise.id}`}
          aria-label={exercise.name}
          className="scroll-mt-4"
          onPointerDown={() => {
            if (exercise.id !== activeExerciseId) {
              selectExercise(exercise.id);
            }
          }}
        >
          <ExerciseCard exerciseId={exercise.id} layout="list" />
        </section>
      ))}
    </div>
  );
}
