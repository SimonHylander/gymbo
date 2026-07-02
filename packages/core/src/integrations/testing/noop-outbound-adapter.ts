import { defineOutboundAdapter } from "../outbound-adapter"
import { integrationOk } from "../result"
import { createIntegrationId } from "../types"
import type { NoopExternalPayload, NoopInternalPayload } from "./noop-inbound-adapter"

export function createNoopOutboundAdapter(id = createIntegrationId("noop")) {
  return defineOutboundAdapter<NoopInternalPayload, NoopExternalPayload>({
    id,
    toExternal(internal, _ctx) {
      return integrationOk({ ...internal })
    },
  })
}
