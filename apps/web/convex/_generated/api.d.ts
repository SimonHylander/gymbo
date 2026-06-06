/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as exerciseBiofeedback from "../exerciseBiofeedback.js";
import type * as exercises from "../exercises.js";
import type * as init from "../init.js";
import type * as lib_parsePrevious from "../lib/parsePrevious.js";
import type * as lib_programNavigation from "../lib/programNavigation.js";
import type * as lib_repTarget from "../lib/repTarget.js";
import type * as lib_routineTemplate from "../lib/routineTemplate.js";
import type * as lib_routines from "../lib/routines.js";
import type * as migrations_repTargetFields from "../migrations/repTargetFields.js";
import type * as programs from "../programs.js";
import type * as routines from "../routines.js";
import type * as seed from "../seed.js";
import type * as seedDatabase from "../seedDatabase.js";
import type * as validators from "../validators.js";
import type * as workoutExercises from "../workoutExercises.js";
import type * as workouts from "../workouts.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  exerciseBiofeedback: typeof exerciseBiofeedback;
  exercises: typeof exercises;
  init: typeof init;
  "lib/parsePrevious": typeof lib_parsePrevious;
  "lib/programNavigation": typeof lib_programNavigation;
  "lib/repTarget": typeof lib_repTarget;
  "lib/routineTemplate": typeof lib_routineTemplate;
  "lib/routines": typeof lib_routines;
  "migrations/repTargetFields": typeof migrations_repTargetFields;
  programs: typeof programs;
  routines: typeof routines;
  seed: typeof seed;
  seedDatabase: typeof seedDatabase;
  validators: typeof validators;
  workoutExercises: typeof workoutExercises;
  workouts: typeof workouts;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
