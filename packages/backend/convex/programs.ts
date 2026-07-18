import { query } from "./_generated/server"
import { listWithRoutinesReturnsValidator } from "./validators"
import { requireUser } from "./lib/principal"
import { buildListWithRoutines } from "./lib/routineTemplate"

export const listWithRoutines = query({
  args: {},
  returns: listWithRoutinesReturnsValidator,
  handler: async (ctx) => {
    const userId = await requireUser(ctx)
    return await buildListWithRoutines(ctx, userId)
  },
})
