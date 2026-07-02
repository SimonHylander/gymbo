import { v } from "convex/values"

import { query } from "./_generated/server"
import { getAssistantRoutineByExternalId } from "./lib/assistantRoutine"
import { assistantRoutineValidator } from "./validators"

export const getByExternalId = query({
  args: { externalId: v.string() },
  returns: v.union(assistantRoutineValidator, v.null()),
  handler: async (ctx, { externalId }) => {
    return await getAssistantRoutineByExternalId(ctx, externalId)
  },
})
