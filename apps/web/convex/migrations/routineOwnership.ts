import { v } from "convex/values"

import { internalMutation, query } from "../_generated/server"
import { getDevUserId } from "../lib/auth"

export const status = query({
  args: {},
  returns: v.object({
    complete: v.boolean(),
    remainingRoutines: v.number(),
    remainingPrograms: v.number(),
    remaining: v.number(),
  }),
  handler: async (ctx) => {
    const routines = await ctx.db.query("routines").collect()
    const programs = await ctx.db.query("programs").collect()
    const remainingRoutines = routines.filter((row) => row.userId === undefined).length
    const remainingPrograms = programs.filter((row) => row.userId === undefined).length
    const remaining = remainingRoutines + remainingPrograms

    return {
      complete: remaining === 0,
      remainingRoutines,
      remainingPrograms,
      remaining,
    }
  },
})

export const backfillDevOwnership = internalMutation({
  args: {
    dryRun: v.boolean(),
  },
  returns: v.object({
    dryRun: v.boolean(),
    candidateRoutines: v.number(),
    candidatePrograms: v.number(),
    patchedRoutines: v.number(),
    patchedPrograms: v.number(),
  }),
  handler: async (ctx, { dryRun }) => {
    const userId = getDevUserId()
    const routines = await ctx.db.query("routines").collect()
    const programs = await ctx.db.query("programs").collect()
    const candidateRoutines = routines.filter((row) => row.userId === undefined)
    const candidatePrograms = programs.filter((row) => row.userId === undefined)

    if (!dryRun) {
      for (const routine of candidateRoutines) {
        await ctx.db.patch(routine._id, { userId })
      }
      for (const program of candidatePrograms) {
        await ctx.db.patch(program._id, { userId })
      }
    }

    return {
      dryRun,
      candidateRoutines: candidateRoutines.length,
      candidatePrograms: candidatePrograms.length,
      patchedRoutines: dryRun ? 0 : candidateRoutines.length,
      patchedPrograms: dryRun ? 0 : candidatePrograms.length,
    }
  },
})
