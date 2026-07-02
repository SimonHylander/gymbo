import { describe, expect, it } from "vitest"

import { IntegrationErrorCode, createIntegrationError } from "../errors"
import {
  flatMapIntegrationResult,
  integrationErr,
  integrationNotFound,
  integrationOk,
  mapIntegrationResult,
  unwrapIntegrationResult,
} from "../result"

describe("integration result helpers", () => {
  it("creates ok and err results", () => {
    expect(integrationOk("value")).toEqual({ ok: true, value: "value" })
    expect(
      integrationErr(
        createIntegrationError(IntegrationErrorCode.MappingFailed, "failed"),
      ),
    ).toEqual({
      ok: false,
      error: { code: IntegrationErrorCode.MappingFailed, message: "failed" },
    })
  })

  it("maps successful results", () => {
    const mapped = mapIntegrationResult(integrationOk(2), (value) => value * 2)
    expect(mapped).toEqual({ ok: true, value: 4 })
  })

  it("preserves errors when mapping", () => {
    const error = integrationNotFound("missing")
    const mapped = mapIntegrationResult(error, (value: number) => value * 2)

    expect(mapped).toBe(error)
  })

  it("flat maps successful results", () => {
    const mapped = flatMapIntegrationResult(integrationOk(2), (value) =>
      integrationOk(value + 1),
    )

    expect(mapped).toEqual({ ok: true, value: 3 })
  })

  it("unwraps successful results", () => {
    expect(unwrapIntegrationResult(integrationOk("done"))).toBe("done")
  })

  it("throws when unwrapping errors", () => {
    expect(() =>
      unwrapIntegrationResult(
        integrationErr(
          createIntegrationError(IntegrationErrorCode.ValidationFailed, "invalid"),
        ),
      ),
    ).toThrow("invalid")
  })
})
