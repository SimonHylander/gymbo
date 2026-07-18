import { v } from "convex/values"

import { query } from "./_generated/server"
import { getAssistantRoutineByExternalId } from "./lib/assistantRoutine"
import { requireUser } from "./lib/principal"
import { assistantRoutineValidator } from "./validators"

export const getByExternalId = query({
  args: { externalId: v.string() },
  returns: v.union(assistantRoutineValidator, v.null()),
  handler: async (ctx, { externalId }) => {
    const userId = await requireUser(ctx)
    return await getAssistantRoutineByExternalId(ctx, userId, externalId)
  },
})
