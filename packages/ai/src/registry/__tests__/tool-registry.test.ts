import { assert, describe, expect, it } from "@effect/vitest"
import { Effect, Layer, ManagedRuntime, Schema } from "effect"

import { defineTool } from "../../tool"
import {
  PrefixServiceLive,
  makePrefixTool,
} from "../../testing/registry-fixtures"
import { ToolRegistry } from "../tool-registry"

describe("ToolRegistry", () => {
  it("decodes valid input and executes with runtime services", async () => {
    const runtime = ManagedRuntime.make(PrefixServiceLive)
    try {
      const registry = ToolRegistry.empty().add(makePrefixTool()).bind(runtime)
      assert.strictEqual(
        await registry.execute("prefix", { name: "Ada" }),
        "hello Ada"
      )
    } finally {
      await runtime.dispose()
    }
  })

  it("rejects invalid input before executing the tool body", async () => {
    let executions = 0
    const runtime = ManagedRuntime.make(PrefixServiceLive)
    try {
      const registry = ToolRegistry.empty()
        .add(makePrefixTool(() => executions++))
        .bind(runtime)

      await expect(
        registry.execute("prefix", { name: 1 })
      ).rejects.toBeDefined()
      assert.strictEqual(executions, 0)
    } finally {
      await runtime.dispose()
    }
  })

  it("rejects unknown tool names", async () => {
    const runtime = ManagedRuntime.make(Layer.empty)
    try {
      const registry = ToolRegistry.empty().bind(runtime)
      await expect(registry.execute("missing", {})).rejects.toThrow(
        "Unknown tool: missing"
      )
    } finally {
      await runtime.dispose()
    }
  })

  it("rejects duplicate tool names", () => {
    const tool = makePrefixTool()
    expect(() => ToolRegistry.empty().add(tool).add(tool)).toThrow(
      "Duplicate tool name: prefix"
    )
  })

  it("returns readonly metadata with generated JSON Schema", async () => {
    const runtime = ManagedRuntime.make(PrefixServiceLive)
    try {
      const [metadata] = ToolRegistry.empty()
        .add(makePrefixTool())
        .bind(runtime)
        .getAll()
      assert.isDefined(metadata)
      assert.strictEqual(metadata.name, "prefix")
      assert.strictEqual(metadata.category, "testing")
      assert.strictEqual(metadata.inputSchema.dialect, "draft-2020-12")
      assert.deepInclude(metadata.inputSchema.schema, { type: "object" })
    } finally {
      await runtime.dispose()
    }
  })

  it("interrupts execution and runs finalizers when aborted", async () => {
    let finalized = false
    const tool = defineTool({
      name: "wait",
      description: "Waits until interrupted",
      inputSchema: Schema.Struct({}),
      execute: () =>
        Effect.never.pipe(
          Effect.ensuring(Effect.sync(() => (finalized = true)))
        ),
    })
    const runtime = ManagedRuntime.make(Layer.empty)
    try {
      const registry = ToolRegistry.empty().add(tool).bind(runtime)
      const controller = new AbortController()
      const execution = registry.execute(
        "wait",
        {},
        { signal: controller.signal }
      )
      controller.abort()

      await expect(execution).rejects.toBeDefined()
      assert.isTrue(finalized)
    } finally {
      await runtime.dispose()
    }
  })
})
