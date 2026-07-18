import { describe, expect, it } from "vitest";

import {
  deriveRepTargetMode,
  formatRepTargetLabel,
  normalizeRepTargetForSave,
  parseRepInput,
  validateRepTarget,
} from "./rep-target";

describe("deriveRepTargetMode", () => {
  it("returns range when min or max is set", () => {
    expect(deriveRepTargetMode({ repRangeMin: 6 })).toBe("range");
    expect(deriveRepTargetMode({ repRangeMax: 12 })).toBe("range");
    expect(deriveRepTargetMode({ repRangeMin: 6, repRangeMax: 12 })).toBe(
      "range"
    );
  });

  it("returns single when only reps or nothing is set", () => {
    expect(deriveRepTargetMode({ reps: 8 })).toBe("single");
    expect(deriveRepTargetMode({})).toBe("single");
  });
});

describe("formatRepTargetLabel", () => {
  it("formats single reps", () => {
    expect(formatRepTargetLabel({ reps: 8 })).toBe("8");
  });

  it("formats rep range with en dash", () => {
    expect(formatRepTargetLabel({ repRangeMin: 6, repRangeMax: 12 })).toBe(
      "6–12"
    );
  });

  it("returns null when empty", () => {
    expect(formatRepTargetLabel({})).toBeNull();
  });
});

describe("normalizeRepTargetForSave", () => {
  it("clears range fields in single mode", () => {
    expect(
      normalizeRepTargetForSave("single", {
        reps: 8,
        repRangeMin: 6,
        repRangeMax: 12,
      })
    ).toEqual({ reps: 8 });
  });

  it("clears reps in range mode", () => {
    expect(
      normalizeRepTargetForSave("range", {
        reps: 8,
        repRangeMin: 6,
        repRangeMax: 12,
      })
    ).toEqual({ repRangeMin: 6, repRangeMax: 12 });
  });
});

describe("parseRepInput", () => {
  it("parses valid integers", () => {
    expect(parseRepInput("8")).toBe(8);
    expect(parseRepInput("  12  ")).toBe(12);
  });

  it("returns undefined for empty or invalid", () => {
    expect(parseRepInput("")).toBeUndefined();
    expect(parseRepInput("abc")).toBeUndefined();
    expect(parseRepInput("-1")).toBeUndefined();
  });
});

describe("validateRepTarget", () => {
  it("accepts valid single and range targets", () => {
    expect(validateRepTarget({ reps: 8 })).toBeNull();
    expect(validateRepTarget({ repRangeMin: 6, repRangeMax: 12 })).toBeNull();
    expect(validateRepTarget({})).toBeNull();
  });

  it("rejects mixed single and range", () => {
    expect(
      validateRepTarget({ reps: 8, repRangeMin: 6, repRangeMax: 12 })
    ).toMatch(/not both/i);
  });

  it("rejects partial range", () => {
    expect(validateRepTarget({ repRangeMin: 6 })).toMatch(/both min and max/i);
  });

  it("rejects min greater than max", () => {
    expect(validateRepTarget({ repRangeMin: 12, repRangeMax: 6 })).toMatch(
      /min cannot exceed max/i
    );
  });
});
