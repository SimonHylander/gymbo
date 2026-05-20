import { internalMutation } from "./_generated/server"
import { seedDatabase } from "./seedDatabase"

/**
 * Idempotent database bootstrap for dev and preview deployments.
 *
 * Run manually:  npx convex run init
 * On dev start:  convex dev --run init
 * Preview deploy: npx convex deploy --cmd 'npm run build' --preview-run init
 */
export default internalMutation({
  args: {},
  handler: async (ctx) => seedDatabase(ctx),
})
