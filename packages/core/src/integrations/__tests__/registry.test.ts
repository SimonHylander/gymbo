import { describe, expect, it } from "vitest"

import { IntegrationErrorCode } from "../errors"
import { defineInboundAdapter } from "../inbound-adapter"
import { defineOutboundAdapter } from "../outbound-adapter"
import { createIntegrationRegistry } from "../registry"
import { integrationOk } from "../result"
import { createIntegrationId } from "../types"

describe("IntegrationRegistry", () => {
  const integrationId = createIntegrationId("test-provider")

  const inbound = defineInboundAdapter<{ external: string }, { internal: string }>({
    id: integrationId,
    parse: (input) => {
      if (typeof input !== "object" || input === null || !("external" in input)) {
        return { ok: false, error: { code: IntegrationErrorCode.ParseFailed, message: "bad" } }
      }

      return integrationOk({ external: String((input as { external: unknown }).external) })
    },
    toInternal: (external) => integrationOk({ internal: external.external }),
  })

  const outbound = defineOutboundAdapter<{ internal: string }, { external: string }>({
    id: integrationId,
    toExternal: (internal) => integrationOk({ external: internal.internal }),
  })

  it("registers and retrieves inbound adapters", () => {
    const registry = createIntegrationRegistry()
    const registered = registry.registerInbound(inbound)

    expect(registered.ok).toBe(true)
    expect(registry.has(integrationId, "inbound")).toBe(true)

    const resolved = registry.getInbound(integrationId)
    expect(resolved.ok).toBe(true)

    if (resolved.ok) {
      expect(resolved.value.id).toBe(integrationId)
    }
  })

  it("registers and retrieves outbound adapters", () => {
    const registry = createIntegrationRegistry()
    const registered = registry.registerOutbound(outbound)

    expect(registered.ok).toBe(true)
    expect(registry.has(integrationId, "outbound")).toBe(true)

    const resolved = registry.getOutbound(integrationId)
    expect(resolved.ok).toBe(true)

    if (resolved.ok) {
      expect(resolved.value.id).toBe(integrationId)
    }
  })

  it("returns not found when adapter is missing", () => {
    const registry = createIntegrationRegistry()
    const missing = registry.getInbound(createIntegrationId("missing"))

    expect(missing.ok).toBe(false)

    if (!missing.ok) {
      expect(missing.error.code).toBe(IntegrationErrorCode.NotFound)
    }
  })

  it("returns duplicate registration error for the same id", () => {
    const registry = createIntegrationRegistry()

    expect(registry.registerInbound(inbound).ok).toBe(true)
    const duplicate = registry.registerInbound(inbound)

    expect(duplicate.ok).toBe(false)

    if (!duplicate.ok) {
      expect(duplicate.error.code).toBe(IntegrationErrorCode.DuplicateRegistration)
    }
  })

  it("checks either direction when direction is omitted", () => {
    const registry = createIntegrationRegistry()

    expect(registry.has(integrationId)).toBe(false)

    registry.registerOutbound(outbound)

    expect(registry.has(integrationId)).toBe(true)
    expect(registry.has(integrationId, "inbound")).toBe(false)
    expect(registry.has(integrationId, "outbound")).toBe(true)
  })
})
