import { jsonSchema, tool } from "ai"
import { createExecutionState, executeWithPolicy } from "../policy"
import { filterTools } from "./types"
import type { ToolSet } from "ai"

import type { AdapterOptions, ToolAdapter } from "./types"

export const createVercelAIAdapter = (
  options: AdapterOptions = {}
): ToolAdapter<ToolSet> => ({
  adapt: (registry) => {
    const state = createExecutionState()
    const tools: ToolSet = {}

    for (const metadata of filterTools(registry.getAll(), options)) {
      tools[metadata.name] = tool({
        description: metadata.description,
        inputSchema: jsonSchema(metadata.inputSchema.schema),
        strict: false,
        execute: (input, executionOptions) =>
          executeWithPolicy(
            metadata,
            state,
            options,
            executionOptions.abortSignal,
            ({ signal } = {}) =>
              registry.execute(metadata.name, input, { signal })
          ),
      })
    }

    return tools
  },
})
