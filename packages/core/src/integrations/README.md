# Integrations

`@workspace/core/integrations` provides a small adapter-based toolkit for translating data between Gymbo and external parties — inbound (them → us) and outbound (us → them).

Adapters handle **mapping and validation only**. Transport (HTTP, webhooks, queues, SDK calls) stays in app or infrastructure code.

## Adapter pattern

The adapter pattern bridges incompatible interfaces. At integration boundaries we convert:

- external payloads into Gymbo-internal shapes (inbound)
- Gymbo-internal shapes into external payloads (outbound)

Clients depend on the adapter contracts, not provider-specific formats.

## Inbound vs outbound

| Direction | Flow | Adapter methods |
| --- | --- | --- |
| Inbound | External party → Gymbo | `parse` → `toInternal` |
| Outbound | Gymbo → External party | `toExternal` |

**Inbound example**

```ts
const parsed = inbound.parse(req.body, ctx)
if (!parsed.ok) return respondWithError(parsed.error)

const internal = inbound.toInternal(parsed.value, ctx)
if (!internal.ok) return respondWithError(internal.error)

await applyDomainCommand(internal.value)
```

**Outbound example**

```ts
const external = outbound.toExternal(domainEvent, ctx)
if (!external.ok) return respondWithError(external.error)

await fetch(providerUrl, { body: JSON.stringify(external.value) })
```

## Not feature adapters

This module is for **system integrations** with external parties.

Feature adapters under `apps/web/src/features/*/adapters/` (for example `sync-workout.ts`) are **feature ports**: they wrap Convex or other app services into domain-friendly APIs for UI/state layers.

Keep those separate. Use `@workspace/core/integrations` when crossing a system boundary to a third party.

## Core concepts

### IntegrationId

Stable identifier for a provider:

```ts
import { createIntegrationId } from "@workspace/core/integrations"

const stripeId = createIntegrationId("stripe")
```

### IntegrationContext

Correlation metadata passed through every adapter call:

```ts
const ctx = {
  integrationId: stripeId,
  correlationId: requestId,
  occurredAt: Date.now(), // supplied by caller
}
```

The library does not call `Date.now()` internally.

### IntegrationResult

Explicit success/failure at boundaries:

```ts
type IntegrationResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: IntegrationError }
```

Use `integrationOk`, `integrationErr`, and `integrationNotFound` helpers instead of throwing inside adapters.

### IntegrationRegistry

App-owned registry for lookup by `IntegrationId`:

```ts
import {
  createIntegrationRegistry,
  createIntegrationId,
} from "@workspace/core/integrations"

const registry = createIntegrationRegistry()
const id = createIntegrationId("stripe")

registry.registerInbound(stripeInbound)
registry.registerOutbound(stripeOutbound)

const inbound = registry.getInbound(id)
```

Registration and lookup return `IntegrationResult` — duplicate ids and missing adapters are explicit errors.

## Adding a provider

1. Choose an id: `createIntegrationId("provider-name")`.
2. Define external and internal TypeScript types for that integration.
3. Implement `InboundAdapter` and/or `OutboundAdapter` (or `BidirectionalAdapter` when both directions share one provider).
4. Register adapters on a shared `IntegrationRegistry` instance owned by the app.
5. Handle `IntegrationResult` at call sites; map errors to HTTP responses, logs, or retries in infrastructure code.
6. Add unit tests for `parse`, `toInternal`, and `toExternal` with representative payloads.

Minimal inbound adapter:

```ts
import {
  createIntegrationId,
  defineInboundAdapter,
  integrationOk,
  integrationErr,
  createIntegrationError,
  IntegrationErrorCode,
} from "@workspace/core/integrations"

export const exampleInbound = defineInboundAdapter<
  { event: string },
  { type: string }
>({
  id: createIntegrationId("example"),
  parse(input, _ctx) {
    if (typeof input !== "object" || input === null || !("event" in input)) {
      return integrationErr(
        createIntegrationError(
          IntegrationErrorCode.ParseFailed,
          "Expected { event: string }",
        ),
      )
    }

    return integrationOk({ event: String(input.event) })
  },
  toInternal(external, _ctx) {
    return integrationOk({ type: external.event })
  },
})
```

## Reference implementations

See `testing/` for noop adapters useful as copy-paste templates:

```ts
import {
  createNoopInboundAdapter,
  createNoopOutboundAdapter,
} from "@workspace/core/integrations/testing"
```

- Inbound noop: accepts plain objects in `parse`, identity mapping in `toInternal`.
- Outbound noop: identity mapping in `toExternal`.

## Testing

- Unit-test each adapter in isolation with valid and invalid payloads.
- Registry and result helpers are covered in `__tests__/`.
- Run tests from `packages/core`:

```bash
bun run test
```

## Future extensions

A planned **Connector** layer may handle delivery concerns (HTTP clients, webhook signing, retries, rate limits). Adapters will remain pure data translators.

When a provider grows large, add provider-specific docs alongside it (for example `integrations/stripe/README.md`).
