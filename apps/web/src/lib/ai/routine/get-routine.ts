import { defineTool } from "@workspace/ai"
import { Effect, Schema } from "effect"

import { RoutineService } from "./routine-service"

export const getRoutine = defineTool({
  name: "get_routine",
  description:
    "Fetches the authenticated user's routine details by routine external ID.",
  category: "routine",
  inputSchema: Schema.Struct({
    externalId: Schema.String,
  }),
  execute: ({ externalId }) =>
    Effect.gen(function* () {
      const routines = yield* RoutineService
      return yield* routines.getRoutine(externalId)
    }),
})

