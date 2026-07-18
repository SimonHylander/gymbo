import type { JointPainLevel } from "./joint-pain";
import type { Exercise, WorkoutStatus } from "./types";

export type ExistingJointPainFeedback = {
  workoutExerciseId: string;
  jointPainLevel: JointPainLevel;
};

export type JointPainSessionConfig = {
  open: boolean;
  targetExerciseId: string | null;
  workoutId: string | null;
  exercises: Array<Exercise>;
  workoutExerciseIds: Record<string, string>;
  existingFeedback: Array<ExistingJointPainFeedback> | undefined;
};

export type JointPainSessionState = {
  exerciseIndex: number;
  savedLevels: Record<string, JointPainLevel>;
  isSaving: boolean;
  autoCompleteHandled: boolean;
};

export type JointPainSessionEffect =
  | { type: "complete" }
  | { type: "advanceSingle"; exerciseId: string };

export type JointPainSessionEvent =
  | { type: "opened" }
  | { type: "closed" }
  | { type: "feedbackLoaded"; savedLevels: Record<string, JointPainLevel> }
  | { type: "saveStarted" }
  | {
      type: "saveSucceeded";
      exerciseId: string;
      level: JointPainLevel;
      config: JointPainSessionConfig;
    }
  | { type: "saveFailed" }
  | { type: "autoCompleteAcknowledged" };

export type JointPainViewModel = {
  shouldRender: boolean;
  shouldAutoComplete: boolean;
  currentExercise: Exercise | null;
  displayExerciseIndex: number;
  exerciseCount: number;
  initialLevel: JointPainLevel | undefined;
  isSaving: boolean;
};

export function createJointPainSessionState(): JointPainSessionState {
  return {
    exerciseIndex: 0,
    savedLevels: {},
    isSaving: false,
    autoCompleteHandled: false,
  };
}

export function shouldPromptJointPainAfterExerciseComplete(input: {
  jointPainCheckInOpen: boolean;
  workoutStatus: WorkoutStatus;
}): boolean {
  if (input.jointPainCheckInOpen) return false;
  if (input.workoutStatus !== "ongoing") return false;
  return true;
}

export function openJointPainForExercise(exerciseId: string): {
  jointPainCheckInOpen: true;
  jointPainCheckInExerciseId: string;
} {
  return {
    jointPainCheckInOpen: true,
    jointPainCheckInExerciseId: exerciseId,
  };
}

export function openJointPainWizard(): {
  jointPainCheckInOpen: true;
  jointPainCheckInExerciseId: null;
} {
  return {
    jointPainCheckInOpen: true,
    jointPainCheckInExerciseId: null,
  };
}

export function prefillSavedLevels(
  _exercises: Array<Exercise>,
  workoutExerciseIds: Record<string, string>,
  feedback: Array<ExistingJointPainFeedback>
): Record<string, JointPainLevel> {
  const workoutExerciseIdToExerciseId = Object.fromEntries(
    Object.entries(workoutExerciseIds).map(([exerciseId, workoutExerciseId]) => [
      workoutExerciseId,
      exerciseId,
    ])
  );

  const savedLevels: Record<string, JointPainLevel> = {};

  for (const entry of feedback) {
    const exerciseId = workoutExerciseIdToExerciseId[entry.workoutExerciseId];
    if (exerciseId) {
      savedLevels[exerciseId] = entry.jointPainLevel;
    }
  }

  return savedLevels;
}

function getEffectiveSavedLevels(
  config: JointPainSessionConfig,
  state: JointPainSessionState
): Record<string, JointPainLevel> {
  const prefilled =
    config.existingFeedback === undefined
      ? {}
      : prefillSavedLevels(
          config.exercises,
          config.workoutExerciseIds,
          config.existingFeedback
        );

  return { ...prefilled, ...state.savedLevels };
}

function allExercisesRated(
  config: JointPainSessionConfig,
  savedLevels: Record<string, JointPainLevel>
): boolean {
  return config.exercises.every((exercise) => savedLevels[exercise.id] !== undefined);
}

function getWizardExercises(config: JointPainSessionConfig): Array<Exercise> {
  if (config.targetExerciseId) {
    const exercise = config.exercises.find(
      (entry) => entry.id === config.targetExerciseId
    );
    return exercise ? [exercise] : [];
  }

  return config.exercises;
}

export function selectJointPainViewModel(
  config: JointPainSessionConfig,
  state: JointPainSessionState
): JointPainViewModel {
  const wizardExercises = getWizardExercises(config);
  const exerciseCount = wizardExercises.length;
  const effectiveSavedLevels = getEffectiveSavedLevels(config, state);

  const feedbackLoaded = config.existingFeedback !== undefined;
  const allRated = feedbackLoaded && allExercisesRated(config, effectiveSavedLevels);

  const shouldAutoComplete =
    config.open &&
    feedbackLoaded &&
    allRated &&
    !state.autoCompleteHandled &&
    config.targetExerciseId === null;

  if (!config.open || exerciseCount === 0) {
    return {
      shouldRender: false,
      shouldAutoComplete,
      currentExercise: null,
      displayExerciseIndex: 0,
      exerciseCount,
      initialLevel: undefined,
      isSaving: state.isSaving,
    };
  }

  if (allRated && config.targetExerciseId === null) {
    return {
      shouldRender: false,
      shouldAutoComplete,
      currentExercise: null,
      displayExerciseIndex: exerciseCount,
      exerciseCount,
      initialLevel: undefined,
      isSaving: state.isSaving,
    };
  }

  const currentExercise =
    config.targetExerciseId !== null
      ? wizardExercises[0] ?? null
      : wizardExercises[state.exerciseIndex] ?? null;

  const initialLevel = currentExercise
    ? effectiveSavedLevels[currentExercise.id]
    : undefined;

  return {
    shouldRender: currentExercise !== null && !shouldAutoComplete,
    shouldAutoComplete,
    currentExercise,
    displayExerciseIndex:
      config.targetExerciseId !== null ? 1 : state.exerciseIndex + 1,
    exerciseCount,
    initialLevel,
    isSaving: state.isSaving,
  };
}

export function reduceJointPainSession(
  state: JointPainSessionState,
  event: JointPainSessionEvent
): { state: JointPainSessionState; effects: Array<JointPainSessionEffect> } {
  switch (event.type) {
    case "opened":
      return { state: createJointPainSessionState(), effects: [] };

    case "closed":
      return { state: createJointPainSessionState(), effects: [] };

    case "feedbackLoaded":
      return {
        state: {
          ...state,
          savedLevels: { ...state.savedLevels, ...event.savedLevels },
        },
        effects: [],
      };

    case "saveStarted":
      return {
        state: { ...state, isSaving: true },
        effects: [],
      };

    case "saveFailed":
      return {
        state: { ...state, isSaving: false },
        effects: [],
      };

    case "saveSucceeded": {
      const { exerciseId, level, config } = event;
      const savedLevels = { ...state.savedLevels, [exerciseId]: level };

      if (config.targetExerciseId !== null) {
        return {
          state: { ...state, savedLevels, isSaving: false },
          effects: [{ type: "advanceSingle", exerciseId }],
        };
      }

      const effectiveSavedLevels = getEffectiveSavedLevels(config, {
        ...state,
        savedLevels,
      });

      if (allExercisesRated(config, effectiveSavedLevels)) {
        return {
          state: { ...state, savedLevels, isSaving: false },
          effects: [{ type: "complete" }],
        };
      }

      return {
        state: {
          ...state,
          savedLevels,
          isSaving: false,
          exerciseIndex: state.exerciseIndex + 1,
        },
        effects: [],
      };
    }

    case "autoCompleteAcknowledged":
      return {
        state: { ...state, autoCompleteHandled: true },
        effects: [{ type: "complete" }],
      };

    default:
      return { state, effects: [] };
  }
}
