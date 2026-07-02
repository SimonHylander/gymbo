import { describe, expect, it, vi } from "vitest"

import {
  createExecutionState,
  executeWithPolicy,
  executionFailedResult,
  serializationFailedResult,
} from "../execution"
import type { ToolMetadata } from "../../tool"

const metadata = (
  name: string,
  overrides: Partial<ToolMetadata> = {}
): ToolMetadata => ({
  name,
  description: `${name} description`,
  inputSchema: {
    dialect: "draft-2020-12",
    schema: {},
    definitions: {},
  },
  ...overrides,
})

describe("execution policy", () => {
  it("executes calls within a cap and caps the first excess call", async () => {
    const execute = vi.fn(() => Promise.resolve("ok"))
    const state = createExecutionState()
    const options = { maxCallsPerTool: { search: 1 } }

    expect(
      await executeWithPolicy(
        metadata("search"),
        state,
        options,
        undefined,
        execute
      )
    ).toBe("ok")
    expect(
      await executeWithPolicy(
        metadata("search"),
        state,
        options,
        undefined,
        execute
      )
    ).toMatchObject({
      type: "tool-call-capped",
    })
    expect(execute).toHaveBeenCalledTimes(1)
  })

  it("short-circuits later calls after a rate-limited result", async () => {
    const execute = vi.fn(() => Promise.resolve({ rateLimited: true }))
    const state = createExecutionState()

    expect(
      await executeWithPolicy(metadata("search"), state, {}, undefined, execute)
    ).toEqual({
      rateLimited: true,
    })
    expect(
      await executeWithPolicy(metadata("search"), state, {}, undefined, execute)
    ).toMatchObject({
      type: "tool-rate-limited",
    })
    expect(execute).toHaveBeenCalledTimes(1)
    expect(state.callCounts.get("search")).toBe(1)
  })

  it("keeps state independent across tool names", async () => {
    const execute = vi.fn(() => Promise.resolve("ok"))
    const state = createExecutionState()
    const options = { maxCallsPerTool: { first: 1, second: 1 } }

    await executeWithPolicy(
      metadata("first"),
      state,
      options,
      undefined,
      execute
    )
    expect(
      await executeWithPolicy(
        metadata("first"),
        state,
        options,
        undefined,
        execute
      )
    ).toMatchObject({
      type: "tool-call-capped",
    })
    expect(
      await executeWithPolicy(
        metadata("second"),
        state,
        options,
        undefined,
        execute
      )
    ).toBe("ok")
  })

  it("creates fresh independent states", async () => {
    const execute = vi.fn(() => Promise.resolve("ok"))
    const options = { maxCallsPerTool: { search: 1 } }

    await executeWithPolicy(
      metadata("search"),
      createExecutionState(),
      options,
      undefined,
      execute
    )
    expect(
      await executeWithPolicy(
        metadata("search"),
        createExecutionState(),
        options,
        undefined,
        execute
      )
    ).toBe("ok")
    expect(execute).toHaveBeenCalledTimes(2)
  })

  it("uses tool-level result-size overrides before policy defaults", async () => {
    const result = await executeWithPolicy(
      metadata("large", { maxToolResultChars: 10, toolResultPreviewChars: 4 }),
      createExecutionState(),
      { maxToolResultChars: 100, toolResultPreviewChars: 50 },
      undefined,
      () => Promise.resolve({ value: "long result" })
    )

    expect(result).toMatchObject({
      type: "tool-result-truncated",
      preview: '{"va',
    })
  })

  it("returns a bounded preview for oversized serializable results", async () => {
    const result = await executeWithPolicy(
      metadata("large"),
      createExecutionState(),
      { maxToolResultChars: 5, toolResultPreviewChars: 3 },
      undefined,
      () => Promise.resolve("abcdefgh")
    )

    expect(result).toMatchObject({ type: "tool-result-truncated" })
    expect(result).toHaveProperty("preview")
    if (typeof result === "object" && result !== null && "preview" in result) {
      expect(result.preview).toHaveLength(3)
    }
  })

  it.each([
    ["undefined", undefined],
    ["bigint", 1n],
    [
      "circular",
      (() => {
        const value: { self?: unknown } = {}
        value.self = value
        return value
      })(),
    ],
  ])("returns a safe serialization failure for %s", async (_label, value) => {
    expect(
      await executeWithPolicy(
        metadata("serialize"),
        createExecutionState(),
        {},
        undefined,
        () => Promise.resolve(value)
      )
    ).toEqual(serializationFailedResult)
  })

  it("reports ordinary failures without exposing them to the model", async () => {
    const error = new Error("private details")
    const onError = vi.fn()

    const result = await executeWithPolicy(
      metadata("fails"),
      createExecutionState(),
      { onError },
      undefined,
      async () => Promise.reject(error)
    )

    expect(result).toEqual(executionFailedResult)
    expect(JSON.stringify(result)).not.toContain("private details")
    expect(onError).toHaveBeenCalledWith(error, "fails")
  })

  it("preserves stable failure when the diagnostic callback throws", async () => {
    const result = await executeWithPolicy(
      metadata("fails"),
      createExecutionState(),
      {
        onError: () => {
          throw new Error("callback failure")
        },
      },
      undefined,
      async () => Promise.reject(new Error("execution failure"))
    )

    expect(result).toEqual(executionFailedResult)
  })

  it("rethrows aborted execution without reporting a diagnostic", async () => {
    const controller = new AbortController()
    const error = new Error("aborted")
    const onError = vi.fn()
    controller.abort()

    await expect(
      executeWithPolicy(
        metadata("cancelled"),
        createExecutionState(),
        { onError },
        controller.signal,
        async () => Promise.reject(error)
      )
    ).rejects.toBe(error)
    expect(onError).not.toHaveBeenCalled()
  })
})
