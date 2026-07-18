import { describe, expect, it } from "vitest"

import {
  
  resolveNextRoutineMembership
} from "./programNavigation"
import type {ProgramMembership} from "./programNavigation";

function membership(
  order: number,
  externalId: string,
  name: string
): ProgramMembership {
  return { order, routine: { externalId, name } }
}

describe("resolveNextRoutineMembership", () => {
  const split: Array<ProgramMembership> = [
    membership(0, "day-a", "Day A"),
    membership(1, "day-b", "Day B"),
    membership(2, "day-c", "Day C"),
  ]

  it("returns the next routine in order", () => {
    expect(resolveNextRoutineMembership(0, split)).toEqual({
      externalId: "day-b",
      name: "Day B",
    })
  })

  it("returns null for the last routine in the program", () => {
    expect(resolveNextRoutineMembership(2, split)).toBeNull()
  })

  it("returns null when memberships are empty", () => {
    expect(resolveNextRoutineMembership(0, [])).toBeNull()
  })

  it("returns null when the next order is missing", () => {
    const withGap = [membership(0, "day-a", "Day A"), membership(2, "day-c", "Day C")]
    expect(resolveNextRoutineMembership(0, withGap)).toBeNull()
  })
})
