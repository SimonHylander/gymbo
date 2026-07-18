import { describe, expect, it } from "vitest";

import {
  routineDetailStats,
  routineExerciseNamePreview,
} from "./routine-detail-summary";

describe("routineDetailStats", () => {
  it("returns zero counts for empty exercises", () => {
    expect(routineDetailStats([])).toEqual({
      exerciseCount: 0,
      totalSets: 0,
    });
  });

  it("sums set counts across exercises", () => {
    expect(
      routineDetailStats([
        { sets: [{}, {}] },
        { sets: [{}] },
        { sets: [] },
      ])
    ).toEqual({
      exerciseCount: 3,
      totalSets: 3,
    });
  });
});

describe("routineExerciseNamePreview", () => {
  const names = (items: string[]) => items.map((name) => ({ name }));

  it("returns empty preview for no exercises", () => {
    expect(routineExerciseNamePreview([])).toEqual({
      preview: "",
      remaining: 0,
    });
  });

  it("joins up to maxNames without suffix", () => {
    expect(routineExerciseNamePreview(names(["Squat", "Bench"]), 3)).toEqual({
      preview: "Squat · Bench",
      remaining: 0,
    });
  });

  it("joins exactly maxNames without suffix", () => {
    expect(
      routineExerciseNamePreview(
        names(["Squat", "Bench press", "Barbell row"]),
        3
      )
    ).toEqual({
      preview: "Squat · Bench press · Barbell row",
      remaining: 0,
    });
  });

  it("truncates beyond maxNames with remaining count", () => {
    expect(
      routineExerciseNamePreview(
        names([
          "Squat",
          "Bench press",
          "Barbell row",
          "Pull-up",
          "Curl",
          "Extension",
        ]),
        3
      )
    ).toEqual({
      preview: "Squat · Bench press · Barbell row",
      remaining: 3,
    });
  });
});
