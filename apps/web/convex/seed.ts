import { internalMutation } from "./_generated/server"
import { seedDatabase } from "./seedDatabase"

/** @deprecated Prefer `npx convex run init` */
export const seedMockRoutine = internalMutation({
  args: {},
  handler: async (ctx) => seedDatabase(ctx),
})
