import { describe, expect, it } from "vitest"

import { parseLegacyRepTarget } from "./repTarget"

describe("parseLegacyRepTarget", () => {
  it("parses single numeric strings", () => {
    expect(parseLegacyRepTarget("8")).toEqual({ reps: 8 })
  })

  it("parses rep ranges with hyphen or en dash", () => {
    expect(parseLegacyRepTarget("10-12")).toEqual({
      repRangeMin: 10,
      repRangeMax: 12,
    })
    expect(parseLegacyRepTarget("10–12")).toEqual({
      repRangeMin: 10,
      repRangeMax: 12,
    })
  })

  it("passes through numbers", () => {
    expect(parseLegacyRepTarget(8)).toEqual({ reps: 8 })
  })

  it("returns empty for unparseable strings", () => {
    expect(parseLegacyRepTarget("heavy")).toEqual({})
  })
})
