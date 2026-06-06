import { query } from "./_generated/server"
import { listWithRoutinesReturnsValidator } from "./validators"
import { buildListWithRoutines } from "./lib/routineTemplate"

export const listWithRoutines = query({
  args: {},
  returns: listWithRoutinesReturnsValidator,
  handler: async (ctx) => {
    return await buildListWithRoutines(ctx)
  },
})
