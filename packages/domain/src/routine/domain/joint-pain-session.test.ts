import { describe, expect, it } from "vitest";

import {
  createJointPainSessionState,
  openJointPainForExercise,
  openJointPainWizard,
  prefillSavedLevels,
  reduceJointPainSession,
  selectJointPainViewModel,
  shouldPromptJointPainAfterExerciseComplete,
  type JointPainSessionConfig,
} from "./joint-pain-session";
import type { Exercise } from "./types";

const exercises: Exercise[] = [
  {
    id: "ex-1",
    name: "Squat",
    sets: [],
    history: [],
  },
  {
    id: "ex-2",
    name: "Bench",
    sets: [],
    history: [],
  },
];

const workoutExerciseIds = {
  "ex-1": "we-1",
  "ex-2": "we-2",
};

function baseConfig(
  overrides: Partial<JointPainSessionConfig> = {}
): JointPainSessionConfig {
  return {
    open: true,
    targetExerciseId: null,
    workoutId: "workout-1",
    exercises,
    workoutExerciseIds,
    existingFeedback: undefined,
    ...overrides,
  };
}

describe("open intent helpers", () => {
  it("shouldPromptJointPainAfterExerciseComplete returns false when already open", () => {
    expect(
      shouldPromptJointPainAfterExerciseComplete({
        jointPainCheckInOpen: true,
        workoutStatus: "ongoing",
      })
    ).toBe(false);
  });

  it("shouldPromptJointPainAfterExerciseComplete returns false when completed", () => {
    expect(
      shouldPromptJointPainAfterExerciseComplete({
        jointPainCheckInOpen: false,
        workoutStatus: "completed",
      })
    ).toBe(false);
  });

  it("openJointPainForExercise sets single-exercise mode", () => {
    expect(openJointPainForExercise("ex-1")).toEqual({
      jointPainCheckInOpen: true,
      jointPainCheckInExerciseId: "ex-1",
    });
  });

  it("openJointPainWizard sets wizard mode", () => {
    expect(openJointPainWizard()).toEqual({
      jointPainCheckInOpen: true,
      jointPainCheckInExerciseId: null,
    });
  });
});

describe("selectJointPainViewModel", () => {
  it("does not auto-complete wizard while feedback is loading", () => {
    const vm = selectJointPainViewModel(
      baseConfig({ existingFeedback: undefined }),
      createJointPainSessionState()
    );

    expect(vm.shouldAutoComplete).toBe(false);
  });

  it("auto-completes wizard when all exercises already rated", () => {
    const vm = selectJointPainViewModel(
      baseConfig({
        existingFeedback: [
          { workoutExerciseId: "we-1", jointPainLevel: 1 },
          { workoutExerciseId: "we-2", jointPainLevel: 0 },
        ],
      }),
      createJointPainSessionState()
    );

    expect(vm.shouldAutoComplete).toBe(true);
    expect(vm.shouldRender).toBe(false);
  });
});

describe("reduceJointPainSession", () => {
  it("resets state on close", () => {
    let state = createJointPainSessionState();
    state = reduceJointPainSession(state, { type: "opened" }).state;
    state = {
      ...state,
      exerciseIndex: 2,
      savedLevels: { "ex-1": 1 },
      isSaving: true,
    };

    const { state: next } = reduceJointPainSession(state, { type: "closed" });

    expect(next).toEqual(createJointPainSessionState());
  });

  it("prefills saved levels on feedbackLoaded", () => {
    const feedback = [
      { workoutExerciseId: "we-1", jointPainLevel: 2 as const },
    ];
    const savedLevels = prefillSavedLevels(
      exercises,
      workoutExerciseIds,
      feedback
    );

    const { state } = reduceJointPainSession(createJointPainSessionState(), {
      type: "feedbackLoaded",
      savedLevels,
    });

    expect(state.savedLevels).toEqual({ "ex-1": 2 });
  });

  it("advances wizard index on mid-list save", () => {
    const config = baseConfig({ existingFeedback: [] });
    const { state, effects } = reduceJointPainSession(
      createJointPainSessionState(),
      {
        type: "saveSucceeded",
        exerciseId: "ex-1",
        level: 1,
        config,
      }
    );

    expect(state.exerciseIndex).toBe(1);
    expect(state.savedLevels).toEqual({ "ex-1": 1 });
    expect(effects).toEqual([]);
  });

  it("completes wizard on last exercise save", () => {
    const config = baseConfig({
      existingFeedback: [{ workoutExerciseId: "we-1", jointPainLevel: 1 }],
    });
    const { state, effects } = reduceJointPainSession(
      createJointPainSessionState(),
      {
        type: "saveSucceeded",
        exerciseId: "ex-2",
        level: 0,
        config,
      }
    );

    expect(state.savedLevels).toEqual({ "ex-2": 0 });
    expect(effects).toEqual([{ type: "complete" }]);
  });

  it("emits advanceSingle in single-exercise mode", () => {
    const config = baseConfig({ targetExerciseId: "ex-1", existingFeedback: [] });
    const { effects } = reduceJointPainSession(createJointPainSessionState(), {
      type: "saveSucceeded",
      exerciseId: "ex-1",
      level: 3,
      config,
    });

    expect(effects).toEqual([{ type: "advanceSingle", exerciseId: "ex-1" }]);
  });

  it("emits complete once when auto-complete is acknowledged", () => {
    const { state, effects } = reduceJointPainSession(
      createJointPainSessionState(),
      { type: "autoCompleteAcknowledged" }
    );

    expect(state.autoCompleteHandled).toBe(true);
    expect(effects).toEqual([{ type: "complete" }]);
  });
});
