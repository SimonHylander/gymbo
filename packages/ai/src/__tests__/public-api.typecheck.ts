import { Effect, Schema } from "effect"
import { ToolRegistry, createVercelAIAdapter, defineTool } from "../index"
import type { ToolSet } from "ai"
import type { ManagedRuntime } from "effect"

import type {
  AdapterOptions,
  BoundToolRegistry,
  ExecutionPolicyOptions,
  PolicyResult,
  ToolAdapter,
  ToolDefinition,
  ToolMetadata,
} from "../index"

declare const runtime: ManagedRuntime.ManagedRuntime<never, unknown>

const definition: ToolDefinition<
  { readonly value: string },
  string,
  never,
  never
> = defineTool({
  name: "public-api",
  description: "Public API compile fixture",
  inputSchema: Schema.Struct({ value: Schema.String }),
  execute: ({ value }) => Effect.succeed(value),
})

const registry: ToolRegistry<never> = ToolRegistry.empty().add(definition)
const bound: BoundToolRegistry = registry.bind(runtime)
const options: AdapterOptions = {}
const policyOptions: ExecutionPolicyOptions = options
const adapter: ToolAdapter<ToolSet> = createVercelAIAdapter(options)
const tools: ToolSet = adapter.adapt(bound)

declare const metadata: ToolMetadata
declare const result: PolicyResult

void policyOptions
void metadata
void result
void tools
