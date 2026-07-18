import { IntegrationErrorCode, createIntegrationError } from "../errors"
import { defineInboundAdapter } from "../inbound-adapter"
import { integrationErr, integrationOk } from "../result"
import { createIntegrationId } from "../types"
import type { IntegrationContext } from "../types"

export type NoopExternalPayload = Readonly<Record<string, unknown>>
export type NoopInternalPayload = Readonly<Record<string, unknown>>

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

export function createNoopInboundAdapter(id = createIntegrationId("noop")) {
  return defineInboundAdapter<NoopExternalPayload, NoopInternalPayload>({
    id,
    parse(input, _ctx) {
      if (!isPlainObject(input)) {
        return integrationErr(
          createIntegrationError(
            IntegrationErrorCode.ParseFailed,
            "Noop inbound adapter expects a plain object payload",
            { details: { receivedType: typeof input } },
          ),
        )
      }

      return integrationOk(input)
    },
    toInternal(external, _ctx) {
      return integrationOk({ ...external })
    },
  })
}

export function createNoopInboundContext(
  integrationId = createIntegrationId("noop"),
): IntegrationContext {
  return { integrationId }
}
