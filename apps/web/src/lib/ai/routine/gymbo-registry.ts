import { ToolRegistry } from "@workspace/ai"

import { getRoutine } from "./get-routine"

export const gymboRegistry = ToolRegistry.empty().add(getRoutine)

