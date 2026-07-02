import { Context } from "effect"
import type { Effect } from "effect"

import type {
  RoutineInfrastructureError,
  RoutineToolView,
  RoutineUnavailable,
} from "./routine-model"

export class RoutineService extends Context.Service<
  RoutineService,
  {
    readonly getRoutine: (
      externalId: string
    ) => Effect.Effect<
      RoutineToolView,
      RoutineUnavailable | RoutineInfrastructureError
    >
  }
>()("RoutineService") {}
