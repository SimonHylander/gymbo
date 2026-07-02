import type { Effect, JsonSchema, Schema } from "effect"

export interface ToolDefinition<TInput, TOutput, TError, TRequirements> {
  readonly name: string
  readonly description: string
  readonly category?: string
  readonly inputSchema: Schema.Codec<TInput, unknown, never, never>
  readonly execute: (
    input: TInput
  ) => Effect.Effect<TOutput, TError, TRequirements>
  readonly maxToolResultChars?: number
  readonly toolResultPreviewChars?: number
}

export const defineTool = <TInput, TOutput, TError, TRequirements>(
  definition: ToolDefinition<TInput, TOutput, TError, TRequirements>
): ToolDefinition<TInput, TOutput, TError, TRequirements> => definition

export interface ToolMetadata {
  readonly name: string
  readonly description: string
  readonly category?: string
  readonly maxToolResultChars?: number
  readonly toolResultPreviewChars?: number
  readonly inputSchema: JsonSchema.Document<"draft-2020-12">
}
