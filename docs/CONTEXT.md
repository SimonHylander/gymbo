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
