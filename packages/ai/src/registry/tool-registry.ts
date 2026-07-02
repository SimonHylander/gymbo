import { Effect, Schema } from "effect"
import type { ManagedRuntime } from "effect"

import type { ToolDefinition, ToolMetadata } from "../tool"

export interface ExecuteOptions {
  readonly signal?: AbortSignal
}

interface RegistryEntry<TRequirements> {
  readonly metadata: ToolMetadata
  readonly execute: (
    input: unknown
  ) => Effect.Effect<unknown, unknown, TRequirements>
}

const makeEntry = <TInput, TOutput, TError, TRequirements>(
  tool: ToolDefinition<TInput, TOutput, TError, TRequirements>
): RegistryEntry<TRequirements> => ({
  metadata: {
    name: tool.name,
    description: tool.description,
    category: tool.category,
    maxToolResultChars: tool.maxToolResultChars,
    toolResultPreviewChars: tool.toolResultPreviewChars,
    inputSchema: Schema.toJsonSchemaDocument(tool.inputSchema),
  },
  execute: (input) =>
    Schema.decodeUnknownEffect(tool.inputSchema)(input).pipe(
      Effect.flatMap(tool.execute)
    ),
})

export class ToolRegistry<TRequirements = never> {
  private constructor(
    private readonly entries: ReadonlyMap<string, RegistryEntry<TRequirements>>
  ) {}

  static empty(): ToolRegistry<never> {
    return new ToolRegistry(new Map())
  }

  add<TInput, TOutput, TError, TAddedRequirements>(
    tool: ToolDefinition<TInput, TOutput, TError, TAddedRequirements>
  ): ToolRegistry<TRequirements | TAddedRequirements> {
    if (this.entries.has(tool.name)) {
      throw new Error(`Duplicate tool name: ${tool.name}`)
    }

    const entries = new Map<
      string,
      RegistryEntry<TRequirements | TAddedRequirements>
    >(this.entries)
    entries.set(tool.name, makeEntry(tool))
    return new ToolRegistry(entries)
  }

  bind(
    runtime: ManagedRuntime.ManagedRuntime<TRequirements, unknown>
  ): BoundToolRegistry {
    const entries = new Map<string, BoundRegistryEntry>()
    for (const [name, entry] of this.entries) {
      entries.set(name, {
        metadata: entry.metadata,
        execute: (input, options) =>
          runtime.runPromise(entry.execute(input), { signal: options?.signal }),
      })
    }
    return new BoundToolRegistry(entries)
  }
}

interface BoundRegistryEntry {
  readonly metadata: ToolMetadata
  readonly execute: (
    input: unknown,
    options?: ExecuteOptions
  ) => Promise<unknown>
}

export class BoundToolRegistry {
  constructor(
    private readonly entries: ReadonlyMap<string, BoundRegistryEntry>
  ) {}

  getAll(): ReadonlyArray<ToolMetadata> {
    return Array.from(this.entries.values(), (entry) => entry.metadata)
  }

  execute(
    name: string,
    unknownInput: unknown,
    options?: ExecuteOptions
  ): Promise<unknown> {
    const entry = this.entries.get(name)
    if (entry === undefined) {
      return Promise.reject(new Error(`Unknown tool: ${name}`))
    }

    return entry.execute(unknownInput, options)
  }
}
