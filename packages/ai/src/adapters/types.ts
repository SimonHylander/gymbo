import type { BoundToolRegistry } from "../registry"
import type { ExecutionPolicyOptions } from "../policy"
import type { ToolMetadata } from "../tool"

export interface ToolAdapter<TOutput> {
  readonly adapt: (registry: BoundToolRegistry) => TOutput
}

export interface AdapterOptions extends ExecutionPolicyOptions {
  readonly include?: ReadonlyArray<string>
  readonly exclude?: ReadonlyArray<string>
}

export const filterTools = (
  tools: ReadonlyArray<ToolMetadata>,
  options: Pick<AdapterOptions, "include" | "exclude"> = {}
): ReadonlyArray<ToolMetadata> => {
  const included =
    options.include === undefined
      ? tools
      : tools.filter((tool) => options.include?.includes(tool.name) === true)

  return options.exclude === undefined
    ? included
    : included.filter((tool) => options.exclude?.includes(tool.name) !== true)
}
