import { describe, expect, it } from "vitest";

import {
  REST_DURATION_OPTION_SECONDS,
  formatRestDurationPickerLabel,
  isRestDurationOption,
  nearestRestDurationOption,
} from "@/lib/rest-duration-options";

describe("REST_DURATION_OPTION_SECONDS", () => {
  it("contains 19 options from 30s to 5min in 15s steps", () => {
    expect(REST_DURATION_OPTION_SECONDS).toHaveLength(19);
    expect(REST_DURATION_OPTION_SECONDS[0]).toBe(30);
    expect(REST_DURATION_OPTION_SECONDS[1]).toBe(45);
    expect(REST_DURATION_OPTION_SECONDS[2]).toBe(60);
    expect(REST_DURATION_OPTION_SECONDS.at(-1)).toBe(300);
  });
});

describe("isRestDurationOption", () => {
  it("returns true for grid values", () => {
    expect(isRestDurationOption(90)).toBe(true);
    expect(isRestDurationOption(300)).toBe(true);
  });

  it("returns false for off-grid values", () => {
    expect(isRestDurationOption(130)).toBe(false);
    expect(isRestDurationOption(29)).toBe(false);
  });
});

describe("nearestRestDurationOption", () => {
  it("returns the same value when already on grid", () => {
    expect(nearestRestDurationOption(90)).toBe(90);
    expect(nearestRestDurationOption(120)).toBe(120);
  });

  it("snaps legacy off-grid values to nearest option", () => {
    expect(nearestRestDurationOption(130)).toBe(135);
    expect(nearestRestDurationOption(127)).toBe(120);
  });
});

describe("formatRestDurationPickerLabel", () => {
  it("formats seconds-only values", () => {
    expect(formatRestDurationPickerLabel(30)).toBe("30s");
    expect(formatRestDurationPickerLabel(45)).toBe("45s");
  });

  it("formats minute-only values", () => {
    expect(formatRestDurationPickerLabel(60)).toBe("1min");
    expect(formatRestDurationPickerLabel(120)).toBe("2min");
  });

  it("formats minute and second values", () => {
    expect(formatRestDurationPickerLabel(75)).toBe("1min 15s");
    expect(formatRestDurationPickerLabel(135)).toBe("2min 15s");
  });
});
