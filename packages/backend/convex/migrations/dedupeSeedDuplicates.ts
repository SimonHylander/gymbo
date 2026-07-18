import { v } from "convex/values"

import type { Doc } from "../_generated/dataModel"
import { internalMutation } from "../_generated/server"

/**
 * Removes duplicate seed rows that share (userId, externalId), keeping the
 * oldest row (the one workout history points at). Duplicates arose when the
 * seed's existence check became user-scoped before the ownership backfill
 * had claimed legacy rows. Duplicate routines that own workouts are skipped
 * and reported instead of deleted.
 */
export const run = internalMutation({
  args: { dryRun: v.boolean() },
  returns: v.object({
    dryRun: v.boolean(),
    deletedRoutines: v.number(),
    deletedPrograms: v.number(),
    deletedRoutineExercises: v.number(),
    deletedProgramRoutines: v.number(),
    skippedRoutinesWithWorkouts: v.number(),
  }),
  handler: async (ctx, { dryRun }) => {
    const stats = {
      dryRun,
      deletedRoutines: 0,
      deletedPrograms: 0,
      deletedRoutineExercises: 0,
      deletedProgramRoutines: 0,
      skippedRoutinesWithWorkouts: 0,
    }

    const duplicatesOf = <T extends Doc<"routines"> | Doc<"programs">>(
      rows: T[]
    ): T[] => {
      const byKey = new Map<string, T[]>()
      for (const row of rows) {
        const key = `${row.userId ?? ""}:${row.externalId}`
        byKey.set(key, [...(byKey.get(key) ?? []), row])
      }
      const duplicates: T[] = []
      for (const group of byKey.values()) {
        const sorted = group.sort((a, b) => a._creationTime - b._creationTime)
        duplicates.push(...sorted.slice(1))
      }
      return duplicates
    }

    const routines = await ctx.db.query("routines").collect()
    for (const routine of duplicatesOf(routines)) {
      const workouts = await ctx.db
        .query("workouts")
        .withIndex("by_routine", (q) => q.eq("routineId", routine._id))
        .collect()
      if (workouts.length > 0) {
        stats.skippedRoutinesWithWorkouts += 1
        continue
      }

      const slots = await ctx.db
        .query("routineExercises")
        .withIndex("by_routine", (q) => q.eq("routineId", routine._id))
        .collect()
      const memberships = await ctx.db
        .query("programRoutines")
        .withIndex("by_routine", (q) => q.eq("routineId", routine._id))
        .collect()

      if (!dryRun) {
        for (const slot of slots) {
          await ctx.db.delete("routineExercises", slot._id)
        }
        for (const membership of memberships) {
          await ctx.db.delete("programRoutines", membership._id)
        }
        await ctx.db.delete("routines", routine._id)
      }
      stats.deletedRoutineExercises += slots.length
      stats.deletedProgramRoutines += memberships.length
      stats.deletedRoutines += 1
    }

    const programs = await ctx.db.query("programs").collect()
    for (const program of duplicatesOf(programs)) {
      const memberships = await ctx.db
        .query("programRoutines")
        .withIndex("by_program", (q) => q.eq("programId", program._id))
        .collect()

      if (!dryRun) {
        for (const membership of memberships) {
          await ctx.db.delete("programRoutines", membership._id)
        }
        await ctx.db.delete("programs", program._id)
      }
      stats.deletedProgramRoutines += memberships.length
      stats.deletedPrograms += 1
    }

    return stats
  },
})
