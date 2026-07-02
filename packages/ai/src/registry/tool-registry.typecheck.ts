import { Layer, ManagedRuntime } from "effect"

import { makePrefixTool } from "../testing/registry-fixtures"
import { ToolRegistry } from "./tool-registry"

const registry = ToolRegistry.empty().add(makePrefixTool())
const emptyRuntime = ManagedRuntime.make(Layer.empty)

// @ts-expect-error The runtime does not provide PrefixService.
registry.bind(emptyRuntime)
