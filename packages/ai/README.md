# `@workspace/ai`

Provider-neutral foundations for defining tools, collecting them in a typed registry,
and adapting a bound registry to AI SDK.

This package does not contain Gymbo business tools, application runtime setup, model selection,
authentication, or a default registry. Business capability ports and concrete tools belong in
downstream packages.

## Lifecycle

1. Define a tool with `defineTool`. Its Effect requirements describe the capabilities needed during
   execution.
2. Add tools to `ToolRegistry`. Requirements accumulate in the registry type.
3. Create a `ManagedRuntime` containing those services and bind the registry to it.
4. Call `createVercelAIAdapter().adapt(boundRegistry)` once per AI request.

The caller owns the `ManagedRuntime` and must dispose it. Binding and adaptation never take runtime
ownership.

Each `adapt()` call creates fresh execution-policy state. Do not cache an adapted tool set across AI
requests. Call caps and rate-limit markers are shared only by executions within that adapted set.

AI SDK abort signals propagate through the execution policy and bound registry into Effect. Abort
failures remain rejected control flow. Ordinary failures and non-serializable results become stable,
generic model-facing markers; raw errors and stacks are not returned to the model.
