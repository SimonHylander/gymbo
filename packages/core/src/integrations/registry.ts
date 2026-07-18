import { integrationDuplicateRegistration, integrationNotFound } from "./result"
import type { InboundAdapter } from "./inbound-adapter"
import type { OutboundAdapter } from "./outbound-adapter"
import type {
  IntegrationDirection,
  IntegrationId,
  IntegrationResult,
} from "./types"

type InboundRegistryEntry = InboundAdapter<unknown, unknown>
type OutboundRegistryEntry = OutboundAdapter<unknown, unknown>

export class IntegrationRegistry {
  private readonly inbound = new Map<IntegrationId, InboundRegistryEntry>()
  private readonly outbound = new Map<IntegrationId, OutboundRegistryEntry>()

  registerInbound<TExternal, TInternal>(
    adapter: InboundAdapter<TExternal, TInternal>,
  ): IntegrationResult<void> {
    if (this.inbound.has(adapter.id)) {
      return integrationDuplicateRegistration(
        `Inbound adapter already registered for integration "${adapter.id}"`,
        { integrationId: adapter.id, direction: "inbound" },
      )
    }

    this.inbound.set(adapter.id, adapter as InboundRegistryEntry)
    return { ok: true, value: undefined }
  }

  registerOutbound<TInternal, TExternal>(
    adapter: OutboundAdapter<TInternal, TExternal>,
  ): IntegrationResult<void> {
    if (this.outbound.has(adapter.id)) {
      return integrationDuplicateRegistration(
        `Outbound adapter already registered for integration "${adapter.id}"`,
        { integrationId: adapter.id, direction: "outbound" },
      )
    }

    this.outbound.set(adapter.id, adapter as OutboundRegistryEntry)
    return { ok: true, value: undefined }
  }

  getInbound<TExternal, TInternal>(
    id: IntegrationId,
  ): IntegrationResult<InboundAdapter<TExternal, TInternal>> {
    const adapter = this.inbound.get(id)

    if (!adapter) {
      return integrationNotFound(`No inbound adapter registered for "${id}"`, {
        integrationId: id,
        direction: "inbound",
      })
    }

    return { ok: true, value: adapter as InboundAdapter<TExternal, TInternal> }
  }

  getOutbound<TInternal, TExternal>(
    id: IntegrationId,
  ): IntegrationResult<OutboundAdapter<TInternal, TExternal>> {
    const adapter = this.outbound.get(id)

    if (!adapter) {
      return integrationNotFound(`No outbound adapter registered for "${id}"`, {
        integrationId: id,
        direction: "outbound",
      })
    }

    return {
      ok: true,
      value: adapter as OutboundAdapter<TInternal, TExternal>,
    }
  }

  has(id: IntegrationId, direction?: IntegrationDirection): boolean {
    if (direction === "inbound") {
      return this.inbound.has(id)
    }

    if (direction === "outbound") {
      return this.outbound.has(id)
    }

    return this.inbound.has(id) || this.outbound.has(id)
  }
}

export function createIntegrationRegistry(): IntegrationRegistry {
  return new IntegrationRegistry()
}
