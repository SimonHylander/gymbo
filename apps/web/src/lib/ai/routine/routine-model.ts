import { Schema } from "effect"

export class RoutineToolExercise extends Schema.Class<RoutineToolExercise>(
  "RoutineToolExercise"
)({
  externalId: Schema.String,
  name: Schema.String,
  repTarget: Schema.optionalKey(Schema.String),
  restSeconds: Schema.optionalKey(Schema.Number),
  notes: Schema.optionalKey(Schema.String),
}) {}

export class RoutineToolView extends Schema.Class<RoutineToolView>(
  "RoutineToolView"
)({
  externalId: Schema.String,
  name: Schema.String,
  exercises: Schema.Array(RoutineToolExercise),
}) {}

export class RoutineUnavailable extends Schema.TaggedErrorClass<RoutineUnavailable>()(
  "RoutineUnavailable",
  {
    externalId: Schema.String,
  }
) {}

export class RoutineInfrastructureError extends Schema.TaggedErrorClass<RoutineInfrastructureError>()(
  "RoutineInfrastructureError",
  {
    message: Schema.String,
    diagnosticCause: Schema.Unknown,
  }
) {}

