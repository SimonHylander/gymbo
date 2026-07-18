import { v } from "convex/values"

import { query } from "./_generated/server"
import { requireUser } from "./lib/principal"
import { exerciseCatalogItemValidator } from "./validators"

const CATALOG_LIMIT = 50

export const list = query({
  args: { search: v.optional(v.string()) },
  returns: v.array(exerciseCatalogItemValidator),
  handler: async (ctx, { search }) => {
    const userId = await requireUser(ctx)
    const all = await ctx.db.query("exercises").collect()
    // Catalog = global entries (no owner) plus the user's own.
    const visible = all.filter(
      (e) => e.userId === undefined || e.userId === userId
    )
    const needle = search?.trim().toLowerCase() ?? ""

    const filtered = needle
      ? visible.filter((e) => e.name.toLowerCase().includes(needle))
      : visible

    return filtered.slice(0, CATALOG_LIMIT).map((e) => ({
      externalId: e.externalId,
      name: e.name,
    }))
  },
})
