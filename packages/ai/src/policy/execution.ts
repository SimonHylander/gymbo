import type { ToolMetadata } from "../tool"

const DEFAULT_MAX_TOOL_RESULT_CHARS = 12_000
const DEFAULT_TOOL_RESULT_PREVIEW_CHARS = 8_000

export interface ExecutionPolicyOptions {
  readonly maxCallsPerTool?: Readonly<Record<string, number>>
  readonly maxToolResultChars?: number
  readonly toolResultPreviewChars?: number
  readonly onError?: (error: unknown, toolName: string) => void
}

export interface ExecutionState {
  readonly callCounts: Map<string, number>
  readonly rateLimitedTools: Set<string>
}

export interface CappedResult {
  readonly type: "tool-call-capped"
  readonly message: string
}

export interface RateLimitedResult {
  readonly type: "tool-rate-limited"
  readonly message: string
}

export interface TruncatedResult {
  readonly type: "tool-result-truncated"
  readonly message: string
  readonly originalLength: number
  readonly preview: string
}

export interface ExecutionFailedResult {
  readonly type: "tool-execution-failed"
  readonly message: string
}

export interface SerializationFailedResult {
  readonly type: "tool-result-serialization-failed"
  readonly message: string
}

export type PolicyResult =
  | CappedResult
  | RateLimitedResult
  | TruncatedResult
  | ExecutionFailedResult
  | SerializationFailedResult

export const cappedResult: CappedResult = {
  type: "tool-call-capped",
  message: "This tool reached its call limit for the current request.",
}

export const rateLimitedResult: RateLimitedResult = {
  type: "tool-rate-limited",
  message: "This tool is unavailable after reporting a rate limit.",
}

export const executionFailedResult: ExecutionFailedResult = {
  type: "tool-execution-failed",
  message: "The tool could not complete the request.",
}

export const serializationFailedResult: SerializationFailedResult = {
  type: "tool-result-serialization-failed",
  message: "The tool returned a result that could not be serialized.",
}

export const createExecutionState = (): ExecutionState => ({
  callCounts: new Map(),
  rateLimitedTools: new Set(),
})

const isRateLimitedResult = (value: unknown): boolean =>
  typeof value === "object" &&
  value !== null &&
  "rateLimited" in value &&
  value.rateLimited === true

const serializeResult = (
  result: unknown,
  maxChars: number,
  previewChars: number
): unknown | TruncatedResult | SerializationFailedResult => {
  if (result === undefined) {
    return serializationFailedResult
  }
  try {
    const serialized = JSON.stringify(result)
    if (serialized.length <= maxChars) {
      return result
    }
    return {
      type: "tool-result-truncated",
      message: "The tool result was truncated to fit the response limit.",
      originalLength: serialized.length,
      preview: serialized.slice(0, Math.max(0, previewChars)),
    }
  } catch {
    return serializationFailedResult
  }
}

export interface BoundExecution {
  (options?: { readonly signal?: AbortSignal }): Promise<unknown>
}

export const executeWithPolicy = async (
  metadata: ToolMetadata,
  state: ExecutionState,
  options: ExecutionPolicyOptions,
  signal: AbortSignal | undefined,
  execute: BoundExecution
): Promise<unknown | PolicyResult> => {
  if (state.rateLimitedTools.has(metadata.name)) {
    return rateLimitedResult
  }

  const callCount = state.callCounts.get(metadata.name) ?? 0
  const maxCalls = options.maxCallsPerTool?.[metadata.name]
  if (maxCalls !== undefined && callCount >= maxCalls) {
    return cappedResult
  }
  state.callCounts.set(metadata.name, callCount + 1)

  try {
    const result = await execute({ signal })
    if (isRateLimitedResult(result)) {
      state.rateLimitedTools.add(metadata.name)
    }

    return serializeResult(
      result,
      metadata.maxToolResultChars ??
        options.maxToolResultChars ??
        DEFAULT_MAX_TOOL_RESULT_CHARS,
      metadata.toolResultPreviewChars ??
        options.toolResultPreviewChars ??
        DEFAULT_TOOL_RESULT_PREVIEW_CHARS
    )
  } catch (error) {
    if (signal?.aborted === true) {
      throw error
    }
    try {
      options.onError?.(error, metadata.name)
    } catch {
      return executionFailedResult
    }
    return executionFailedResult
  }
}
