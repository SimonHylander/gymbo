import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { getActiveExercise } from "@/features/routine/domain/session-selectors";
import { ExerciseCard, exerciseCardHeight } from "@/features/routine/components/exercise-card/exercise-card";
import { RoutineExerciseList } from "@/features/routine/components/routine-exercise-list";
import { useRoutineSession } from "@/features/routine/store/routine-session-context";

const exerciseCardTransition = {
  duration: 0.34,
  ease: [0.32, 0.72, 0, 1] as const,
};

const exerciseCardVariants = {
  enter: (direction: number) => ({
    x: direction === 0 ? 0 : `${direction * 100}%`,
    opacity: direction === 0 ? 1 : 0.92,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction === 0 ? 0 : `${direction * -100}%`,
    opacity: direction === 0 ? 1 : 0.92,
  }),
};

function RoutineExerciseStageDesktop() {
  const routine = useRoutineSession((state) => state.routine);
  const activeExerciseId = useRoutineSession((state) => state.activeExerciseId);
  const switchDirection = useRoutineSession((state) => state.switchDirection);
  const shouldReduceMotion = useReducedMotion();

  const activeExercise = getActiveExercise(routine, activeExerciseId);

  return (
    <div
      className="grid overflow-x-clip [&>*]:col-start-1 [&>*]:row-start-1"
      style={{ height: exerciseCardHeight }}
    >
      <AnimatePresence custom={switchDirection} initial={false}>
        {activeExercise && (
          <motion.div
            key={activeExercise.id}
            custom={switchDirection}
            variants={exerciseCardVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={
              shouldReduceMotion ? { duration: 0 } : exerciseCardTransition
            }
            className="w-full"
          >
            <ExerciseCard />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function RoutineExerciseStage() {
  return (
    <>
      <div className="md:hidden">
        <RoutineExerciseList />
      </div>
      <div className="hidden md:block">
        <RoutineExerciseStageDesktop />
      </div>
    </>
  );
}
