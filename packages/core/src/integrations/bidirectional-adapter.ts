import type { InboundAdapter } from "./inbound-adapter"
import type { OutboundAdapter } from "./outbound-adapter"
import type { IntegrationId } from "./types"

export type BidirectionalAdapter<TExternal, TInternal> = InboundAdapter<
  TExternal,
  TInternal
> &
  OutboundAdapter<TInternal, TExternal>

export type BidirectionalAdapterDefinition<TExternal, TInternal> = {
  readonly id: IntegrationId
  parse: InboundAdapter<TExternal, TInternal>["parse"]
  toInternal: InboundAdapter<TExternal, TInternal>["toInternal"]
  toExternal: OutboundAdapter<TInternal, TExternal>["toExternal"]
}

export function defineBidirectionalAdapter<TExternal, TInternal>(
  adapter: BidirectionalAdapterDefinition<TExternal, TInternal>,
): BidirectionalAdapter<TExternal, TInternal> {
  return adapter
}
