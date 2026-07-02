import { gymboRegistry } from "./gymbo-registry"
import type { RoutineService } from "./routine-service"
import type { ManagedRuntime } from "effect"

declare const runtimeWithoutRoutineService: ManagedRuntime.ManagedRuntime<
  never,
  never
>

declare const runtimeWithRoutineService: ManagedRuntime.ManagedRuntime<
  RoutineService,
  never
>

// @ts-expect-error RoutineService must be provided before binding the registry.
gymboRegistry.bind(runtimeWithoutRoutineService)

gymboRegistry.bind(runtimeWithRoutineService)
