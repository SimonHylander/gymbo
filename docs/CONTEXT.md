# Shared Context

## Tool

A provider-neutral definition containing a name, description, self-contained input schema, and an
Effect-returning execution function. Its Effect environment identifies required capabilities.

## Tool Registry

An immutable collection of tools whose type accumulates their Effect requirements. It validates
unknown input before invoking tool logic.

## Bound Tool Registry

A Tool Registry paired with a caller-owned `ManagedRuntime`. It exposes metadata and a cancellable
Promise execution boundary for adapters.

## Tool Adapter

A provider integration that translates a Bound Tool Registry into a provider SDK's tool shape. An
adapter must preserve registry validation and cancellation behavior.

## Capability Port

A narrow Effect service required by a tool, such as access to a repository or external operation.
Business packages define and provide these ports; the AI package does not own them.

## Execution Policy

Request-scoped handling for call caps, rate-limit short-circuiting, result truncation, safe failure
markers, and cancellation preservation. One policy state is created for each adaptation.

## Program

An ordered collection of Routines.

## Routine

A reusable template: a named, ordered list of exercises with targets. Not a record of anything that
happened.

## Workout

A single execution of a Routine by one user. It moves pending → ongoing → completed. A completed
Workout is immutable — an invariant, not an incidental check.

## Exercise Log

The record of one exercise within a Workout: its Sets plus a completed flag.

## Set

One entry in an Exercise Log: weight, unit, reps, and a status.

## Principal

The user identity a backend function attributes data to. Resolved server-side only, never from
client arguments.

## In-flight Write

A mutation dispatched to the backend whose result has not yet been received. Deliberately not
called "pending."

## Drain

Waiting for all in-flight writes to settle. Completing a Workout drains first, because a completed
Workout is immutable.

## Pending

A schema status with two existing meanings: a Workout that has not started, and a Set that has not
been logged. "In-flight" is reserved for dispatched-but-unacknowledged writes, so this collision
does not grow.
