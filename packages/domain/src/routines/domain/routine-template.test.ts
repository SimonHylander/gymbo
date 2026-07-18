import { describe, expect, it } from "vitest";

import { detailToDraft, draftToUpdateArgs } from "./map-routine-template";
import {
  addSetToExercise,
  validateDraft,
} from "./routine-template";
import type { RoutineDetail } from "./types";

const sampleDetail: RoutineDetail = {
  id: "routine-1",
  name: "Push Day",
  nextRoutine: null,
  exercises: [
    {
      id: "slot-1",
      exerciseExternalId: "ex-1",
      name: "Bench Press",
      reps: 8,
      restSeconds: 90,
      sets: [
        { previous: "60kg", weight: "", unit: "kg", reps: "", status: "pending" },
      ],
    },
  ],
};

describe("map-routine-template", () => {
  it("maps detail to draft and back to update args", () => {
    const draft = detailToDraft(sampleDetail);
    expect(draft.exercises[0]?.exerciseExternalId).toBe("ex-1");
    expect(draft.exercises[0]?.setTemplates[0]?.previous).toBe("60kg");

    const args = draftToUpdateArgs(draft);
    expect(args.externalId).toBe("routine-1");
    expect(args.exercises[0]?.order).toBe(0);
    expect(args.exercises[0]?.setTemplates).toHaveLength(1);
  });
});

describe("routine-template", () => {
  it("validates draft name", () => {
    const draft = detailToDraft(sampleDetail);
    expect(validateDraft(draft)).toBeNull();
    expect(validateDraft({ ...draft, name: "  " })).toMatch(/name/i);
  });

  it("adds set to exercise", () => {
    const draft = detailToDraft(sampleDetail);
    const updated = addSetToExercise(draft.exercises[0]);
    expect(updated.setTemplates).toHaveLength(2);
  });
});
