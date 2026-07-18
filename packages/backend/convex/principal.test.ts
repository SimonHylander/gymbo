import { convexTest } from "convex-test"
import { describe, expect, it, vi, afterEach } from "vitest"

import { api } from "./_generated/api"
import type { Id } from "./_generated/dataModel"
import schema from "./schema"

const modules = import.meta.glob("./**/*.ts")

function setup() {
  return convexTest(schema, modules)
}

type Harness = ReturnType<typeof setup>

/** Seeds a routine (with one exercise slot) owned by the given user. */
async function seedRoutine(t: Harness, userId: string) {
  const routineExternalId = `${userId}-routine`
  await t.run(async (ctx) => {
    const exerciseId = await ctx.db.insert("exercises", {
      externalId: "bench-press",
      name: "Bench Press",
    })
    const routineId = await ctx.db.insert("routines", {
      externalId: routineExternalId,
      name: "Push Day",
      userId,
    })
    await ctx.db.insert("routineExercises", {
      routineId,
      exerciseId,
      externalId: `${userId}-slot-1`,
      order: 0,
      setTemplates: [{ previous: "", unit: "kg" }],
    })
  })
  return routineExternalId
}

const asUserA = { subject: "user_a" }
const asUserB = { subject: "user_b" }

afterEach(() => {
  vi.unstubAllEnvs()
})

describe("principal seam — cross-user isolation", () => {
  it("user B cannot read user A's routine", async () => {
    const t = setup()
    const routineExternalId = await seedRoutine(t, "user_a")

    const asA = await t
      .withIdentity(asUserA)
      .query(api.routines.getByExternalId, { externalId: routineExternalId })
    expect(asA?.name).toBe("Push Day")

    const asB = await t
      .withIdentity(asUserB)
      .query(api.routines.getByExternalId, { externalId: routineExternalId })
    expect(asB).toBeNull()
  })

  it("programs.listWithRoutines only returns the caller's routines", async () => {
    const t = setup()
    await seedRoutine(t, "user_a")

    const asA = await t.withIdentity(asUserA).query(api.programs.listWithRoutines, {})
    expect(asA.unassignedRoutines).toHaveLength(1)

    const asB = await t.withIdentity(asUserB).query(api.programs.listWithRoutines, {})
    expect(asB.programs).toHaveLength(0)
    expect(asB.unassignedRoutines).toHaveLength(0)
  })

  it("user B cannot start a workout on user A's routine", async () => {
    const t = setup()
    const routineExternalId = await seedRoutine(t, "user_a")

    await expect(
      t.withIdentity(asUserB).mutation(api.workouts.start, { routineExternalId })
    ).rejects.toThrow(/NOT_FOUND|Routine not found/)
  })

  it("user B cannot read, mutate, or log against user A's workout", async () => {
    const t = setup()
    const routineExternalId = await seedRoutine(t, "user_a")

    const session = await t
      .withIdentity(asUserA)
      .mutation(api.workouts.start, { routineExternalId })
    const workoutExerciseId = Object.values(
      session.workoutExerciseIds
    )[0] as Id<"workoutExercises">

    const foreignSession = await t
      .withIdentity(asUserB)
      .query(api.workouts.getSession, { workoutId: session.workoutId })
    expect(foreignSession).toBeNull()

    await expect(
      t.withIdentity(asUserB).mutation(api.workouts.setActiveExercise, {
        workoutId: session.workoutId,
        exerciseExternalId: "user_a-slot-1",
      })
    ).rejects.toThrow(/Workout not found/)

    await expect(
      t.withIdentity(asUserB).mutation(api.workouts.complete, {
        workoutId: session.workoutId,
      })
    ).rejects.toThrow(/Workout not found/)

    await expect(
      t.withIdentity(asUserB).mutation(api.workoutExercises.addSet, {
        workoutExerciseId,
      })
    ).rejects.toThrow(/Workout not found/)

    await expect(
      t.withIdentity(asUserB).mutation(api.exerciseBiofeedback.recordJointPain, {
        workoutId: session.workoutId,
        workoutExerciseId,
        jointPainLevel: 2,
      })
    ).rejects.toThrow(/Workout not found/)

    await expect(
      t.withIdentity(asUserB).query(api.exerciseBiofeedback.listByWorkout, {
        workoutId: session.workoutId,
      })
    ).rejects.toThrow(/Workout not found/)
  })

  it("workouts are stamped with the principal, never a client-supplied id", async () => {
    const t = setup()
    const routineExternalId = await seedRoutine(t, "user_a")

    const session = await t
      .withIdentity(asUserA)
      .mutation(api.workouts.start, { routineExternalId })
    const workoutExerciseId = Object.values(
      session.workoutExerciseIds
    )[0] as Id<"workoutExercises">

    await t.withIdentity(asUserA).mutation(api.exerciseBiofeedback.recordJointPain, {
      workoutId: session.workoutId,
      workoutExerciseId,
      jointPainLevel: 1,
    })

    await t.run(async (ctx) => {
      const workout = await ctx.db.get("workouts", session.workoutId)
      expect(workout?.userId).toBe("user_a")

      const feedback = await ctx.db.query("exerciseBiofeedback").collect()
      expect(feedback).toHaveLength(1)
      expect(feedback[0]?.userId).toBe("user_a")
    })
  })
})

describe("principal seam — adapters", () => {
  it("dev adapter falls back to the dev principal when unauthenticated", async () => {
    const t = setup()
    await seedRoutine(t, "dev")

    const result = await t.query(api.routines.getByExternalId, {
      externalId: "dev-routine",
    })
    expect(result?.name).toBe("Push Day")
  })

  it("dev adapter honors an injected identity over the dev fallback", async () => {
    const t = setup()
    await seedRoutine(t, "dev")

    const asA = await t.withIdentity(asUserA).query(api.routines.getByExternalId, {
      externalId: "dev-routine",
    })
    expect(asA).toBeNull()
  })

  it("clerk adapter rejects unauthenticated callers", async () => {
    vi.stubEnv("AUTH_PROVIDER", "clerk")
    const t = setup()
    await seedRoutine(t, "dev")

    await expect(
      t.query(api.routines.getByExternalId, { externalId: "dev-routine" })
    ).rejects.toThrow(/UNAUTHENTICATED|Sign in required/)
  })

  it("clerk adapter resolves the verified identity's subject", async () => {
    vi.stubEnv("AUTH_PROVIDER", "clerk")
    const t = setup()
    await seedRoutine(t, "user_a")

    const asA = await t.withIdentity(asUserA).query(api.routines.getByExternalId, {
      externalId: "user_a-routine",
    })
    expect(asA?.name).toBe("Push Day")
  })
})
