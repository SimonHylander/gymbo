import { describe, expect, it } from "vitest";
import { chatStarterActions } from "./starter-actions";

describe("chatStarterActions", () => {
  it("resolves 'Start a workout' to a navigate action targeting /routines", () => {
    const primary = chatStarterActions.find(
      (action) => action.label === "Start a workout"
    );

    expect(primary).toEqual({
      kind: "navigate",
      label: "Start a workout",
      to: "/routines",
    });
  });

  it("gives every action a non-empty label", () => {
    for (const action of chatStarterActions) {
      expect(action.label.trim()).not.toBe("");
    }
  });

  it("gives every prompt action a non-empty message", () => {
    for (const action of chatStarterActions) {
      if (action.kind === "prompt") {
        expect(action.message.trim()).not.toBe("");
      }
    }
  });

  it("has exactly one navigate action until a routine-aware adapter exists", () => {
    const navigateActions = chatStarterActions.filter(
      (action) => action.kind === "navigate"
    );

    expect(navigateActions).toHaveLength(1);
  });
});
