import { describe, expect, it, vi } from "vitest"
import { Effect, Layer, ManagedRuntime, Schema } from "effect"

import { ToolRegistry } from "../../registry"
import {
  PrefixServiceLive,
  makePrefixTool,
} from "../../testing/registry-fixtures"
import { defineTool } from "../../tool"
import { createVercelAIAdapter } from "../vercel-ai"
import type { ToolExecutionOptions, ToolSet } from "ai"

const executionOptions = (abortSignal?: AbortSignal): ToolExecutionOptions => ({
  toolCallId: "call-1",
  messages: [],
  abortSignal,
})

const executeTool = (
  tools: ToolSet,
  name: string,
  input: unknown,
  options: ToolExecutionOptions = executionOptions()
): Promise<unknown> => {
  const selected = tools[name]
  if (selected.execute === undefined) {
    throw new Error(`Missing executable tool: ${name}`)
  }
  return Promise.resolve(selected.execute(input, options))
}

describe("createVercelAIAdapter", () => {
  it("creates AI SDK tools with input schemas", async () => {
    const runtime = ManagedRuntime.make(PrefixServiceLive)
    try {
      const tools: ToolSet = createVercelAIAdapter().adapt(
        ToolRegistry.empty().add(makePrefixTool()).bind(runtime)
      )

      expect(tools.prefix).toMatchObject({
        description: "Prefixes a validated name",
        strict: false,
      })
      expect(tools.prefix.inputSchema).toBeDefined()
    } finally {
      await runtime.dispose()
    }
  })

  it("executes through registry decoding and services", async () => {
    const runtime = ManagedRuntime.make(PrefixServiceLive)
    try {
      const tools = createVercelAIAdapter().adapt(
        ToolRegistry.empty().add(makePrefixTool()).bind(runtime)
      )

      await expect(executeTool(tools, "prefix", { name: "Ada" })).resolves.toBe(
        "hello Ada"
      )
      await expect(
        executeTool(tools, "prefix", { name: 1 })
      ).resolves.toMatchObject({
        type: "tool-execution-failed",
      })
    } finally {
      await runtime.dispose()
    }
  })

  it("applies include and exclude filters", async () => {
    const runtime = ManagedRuntime.make(PrefixServiceLive)
    try {
      const second = defineTool({
        name: "second",
        description: "Second tool",
        inputSchema: Schema.Struct({}),
        execute: () => Effect.succeed("second"),
      })
      const registry = ToolRegistry.empty()
        .add(makePrefixTool())
        .add(second)
        .bind(runtime)

      expect(
        Object.keys(
          createVercelAIAdapter({ include: ["prefix"] }).adapt(registry)
        )
      ).toEqual(["prefix"])
      expect(
        Object.keys(
          createVercelAIAdapter({ exclude: ["prefix"] }).adapt(registry)
        )
      ).toEqual(["second"])
    } finally {
      await runtime.dispose()
    }
  })

  it("shares policy state within one adapted set", async () => {
    const runtime = ManagedRuntime.make(PrefixServiceLive)
    try {
      const tools = createVercelAIAdapter({
        maxCallsPerTool: { prefix: 1 },
      }).adapt(ToolRegistry.empty().add(makePrefixTool()).bind(runtime))

      await expect(executeTool(tools, "prefix", { name: "one" })).resolves.toBe(
        "hello one"
      )
      await expect(
        executeTool(tools, "prefix", { name: "two" })
      ).resolves.toMatchObject({
        type: "tool-call-capped",
      })
    } finally {
      await runtime.dispose()
    }
  })

  it("creates independent policy state for each adaptation", async () => {
    const runtime = ManagedRuntime.make(PrefixServiceLive)
    try {
      const registry = ToolRegistry.empty().add(makePrefixTool()).bind(runtime)
      const adapter = createVercelAIAdapter({ maxCallsPerTool: { prefix: 1 } })

      await expect(
        executeTool(adapter.adapt(registry), "prefix", { name: "one" })
      ).resolves.toBe("hello one")
      await expect(
        executeTool(adapter.adapt(registry), "prefix", { name: "two" })
      ).resolves.toBe("hello two")
    } finally {
      await runtime.dispose()
    }
  })

  it("forwards cancellation and preserves rejection", async () => {
    let finalized = false
    const waitTool = defineTool({
      name: "wait",
      description: "Wait",
      inputSchema: Schema.Struct({}),
      execute: () =>
        Effect.never.pipe(
          Effect.ensuring(Effect.sync(() => (finalized = true)))
        ),
    })
    const runtime = ManagedRuntime.make(Layer.empty)
    try {
      const tools = createVercelAIAdapter().adapt(
        ToolRegistry.empty().add(waitTool).bind(runtime)
      )
      const controller = new AbortController()
      const execution = executeTool(
        tools,
        "wait",
        {},
        executionOptions(controller.signal)
      )
      controller.abort()

      await expect(execution).rejects.toBeDefined()
      expect(finalized).toBe(true)
    } finally {
      await runtime.dispose()
    }
  })

  it("returns safe policy failures without raw errors", async () => {
    const diagnostic = vi.fn()
    const secret = new Error("private stack details")
    const failTool = defineTool({
      name: "fail",
      description: "Fail",
      inputSchema: Schema.Struct({}),
      execute: () => Effect.fail(secret),
    })
    const runtime = ManagedRuntime.make(Layer.empty)
    try {
      const tools = createVercelAIAdapter({ onError: diagnostic }).adapt(
        ToolRegistry.empty().add(failTool).bind(runtime)
      )
      const result = await executeTool(tools, "fail", {})

      expect(result).toMatchObject({ type: "tool-execution-failed" })
      expect(JSON.stringify(result)).not.toContain("private stack details")
      expect(diagnostic).toHaveBeenCalledOnce()
    } finally {
      await runtime.dispose()
    }
  })
})
