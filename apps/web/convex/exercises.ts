import { v } from "convex/values"

import { query } from "./_generated/server"
import { exerciseCatalogItemValidator } from "./validators"

const CATALOG_LIMIT = 50

export const list = query({
  args: { search: v.optional(v.string()) },
  returns: v.array(exerciseCatalogItemValidator),
  handler: async (ctx, { search }) => {
    const all = await ctx.db.query("exercises").collect()
    const needle = search?.trim().toLowerCase() ?? ""

    const filtered = needle
      ? all.filter((e) => e.name.toLowerCase().includes(needle))
      : all

    return filtered.slice(0, CATALOG_LIMIT).map((e) => ({
      externalId: e.externalId,
      name: e.name,
    }))
  },
})
