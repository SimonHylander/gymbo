import { describe, expect, it } from "vitest"

import { validateTemplatePayload } from "./routineTemplate"

describe("validateTemplatePayload", () => {
  it("rejects empty name", () => {
    expect(() =>
      validateTemplatePayload({ name: "  ", exercises: [] })
    ).toThrow(/name/i)
  })

  it("rejects duplicate order", () => {
    expect(() =>
      validateTemplatePayload({
        name: "Test",
        exercises: [
          {
            externalId: "a",
            exerciseExternalId: "ex1",
            order: 0,
            setTemplates: [{ previous: "10kg", unit: "kg" }],
          },
          {
            externalId: "b",
            exerciseExternalId: "ex2",
            order: 0,
            setTemplates: [{ previous: "10kg", unit: "kg" }],
          },
        ],
      })
    ).toThrow(/order/i)
  })

  it("rejects exercises without set templates", () => {
    expect(() =>
      validateTemplatePayload({
        name: "Test",
        exercises: [
          {
            externalId: "a",
            exerciseExternalId: "ex1",
            order: 0,
            setTemplates: [],
          },
        ],
      })
    ).toThrow(/set template/i)
  })

  it("rejects mixed rep target fields", () => {
    expect(() =>
      validateTemplatePayload({
        name: "Test",
        exercises: [
          {
            externalId: "a",
            exerciseExternalId: "ex1",
            order: 0,
            reps: 8,
            repRangeMin: 6,
            repRangeMax: 12,
            setTemplates: [{ previous: "10kg", unit: "kg" }],
          },
        ],
      })
    ).toThrow(/not both/i)
  })

  it("rejects invalid rep range", () => {
    expect(() =>
      validateTemplatePayload({
        name: "Test",
        exercises: [
          {
            externalId: "a",
            exerciseExternalId: "ex1",
            order: 0,
            repRangeMin: 12,
            repRangeMax: 6,
            setTemplates: [{ previous: "10kg", unit: "kg" }],
          },
        ],
      })
    ).toThrow(/min cannot exceed max/i)
  })

  it("accepts valid payload", () => {
    expect(() =>
      validateTemplatePayload({
        name: "Push Day",
        exercises: [
          {
            externalId: "a",
            exerciseExternalId: "ex1",
            order: 0,
            setTemplates: [{ previous: "10kg", unit: "kg" }],
          },
        ],
      })
    ).not.toThrow()
  })
})
