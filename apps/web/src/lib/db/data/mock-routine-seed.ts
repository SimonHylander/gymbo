/** Canonical fixture data for dev Convex seed. */

export const MOCK_ROUTINE_ID = "7c52fccb-9760-4767-8d35-664ac6a6f0ec"
export const MOCK_ROUTINE_B_ID = "b2c3d4e5-9760-4767-8d35-664ac6a6f0f1"
export const MOCK_DEFAULT_PROGRAM_ID = "default-dev-program"

export type MockExerciseSeed = {
  id: string
  name: string
  reps?: number
  repRangeMin?: number
  repRangeMax?: number
  restSeconds?: number
  notes?: string
  previousExamples: string[]
  unit?: string
}

export type MockRoutineSeed = {
  id: string
  name: string
  exercises: MockExerciseSeed[]
}

export type MockProgramSeed = {
  externalId: string
  name: string
  routines: MockRoutineSeed[]
}

export const MOCK_ROUTINE_SEED: MockRoutineSeed = {
  id: MOCK_ROUTINE_ID,
  name: "FBEOD",
  exercises: [
    {
      id: "a1b2c3d4-0001-4000-8000-000000000001",
      name: "Incline Bench Press (Dumbbell)",
      previousExamples: ["14kg x 10", "14kg x 8", "12kg x 8"],
      repRangeMin: 4,
      repRangeMax: 12,
      restSeconds: 120,
    },
    {
      id: "a1b2c3d4-0002-4000-8000-000000000002",
      name: "Shoulder Press (Dumbbell)",
      previousExamples: ["12kg x 8"],
      reps: 8,
    },
    {
      id: "a1b2c3d4-0003-4000-8000-000000000003",
      name: "Rear Delt Reverse Fly (Cable)",
      previousExamples: ["8kg x 12", "8kg x 10"],
      repRangeMin: 10,
      repRangeMax: 12,
    },
    {
      id: "a1b2c3d4-0004-4000-8000-000000000004",
      name: "Lat Pulldown (Cable)",
      previousExamples: ["45kg x 8", "45kg x 8"],
      reps: 8,
    },
    {
      id: "a1b2c3d4-0005-4000-8000-000000000005",
      name: "Triceps Rope Pushdown",
      previousExamples: ["25kg x 15", "25kg x 12"],
      repRangeMin: 15,
      repRangeMax: 20,
      restSeconds: 90,
      notes:
        "Extend your arms fully on each rep and slowly bend them during the negative portion to keep tension on the triceps.",
    },
    {
      id: "a1b2c3d4-0006-4000-8000-000000000006",
      name: "Preacher Curl (Barbell)",
      previousExamples: ["20kg x 8", "20kg x 8"],
      reps: 8,
    },
    {
      id: "a1b2c3d4-0007-4000-8000-000000000007",
      name: "Lateral Raise (Dumbbell)",
      previousExamples: ["6kg x 15", "6kg x 12", "6kg x 12"],
      repRangeMin: 12,
      repRangeMax: 15,
      restSeconds: 105,
      notes:
        "Keep the movement slow and controlled; avoid using momentum, especially as your shoulders start to burn.",
    },
    {
      id: "a1b2c3d4-0008-4000-8000-000000000008",
      name: "Leg Press Horizontal (Machine)",
      previousExamples: ["120kg x 8"],
      repRangeMin: 6,
      repRangeMax: 10,
    },
    {
      id: "a1b2c3d4-0009-4000-8000-000000000009",
      name: "Seated Leg Curl (Machine)",
      previousExamples: ["35kg x 10"],
    },
  ],
}

export const MOCK_ROUTINE_B_SEED: MockRoutineSeed = {
  id: MOCK_ROUTINE_B_ID,
  name: "Day B",
  exercises: [
    {
      id: "b1b2c3d4-0001-4000-8000-000000000001",
      name: "Barbell Squat",
      previousExamples: ["80kg x 5"],
      reps: 5,
    },
    {
      id: "b1b2c3d4-0002-4000-8000-000000000002",
      name: "Romanian Deadlift",
      previousExamples: ["60kg x 8"],
      reps: 8,
    },
  ],
}

export const MOCK_DEFAULT_PROGRAM_SEED: MockProgramSeed = {
  externalId: MOCK_DEFAULT_PROGRAM_ID,
  name: "Default Split",
  routines: [MOCK_ROUTINE_SEED, MOCK_ROUTINE_B_SEED],
}
