import type { IntegrationContext, IntegrationId, IntegrationResult } from "./types"

export interface OutboundAdapter<TInternal, TExternal> {
  readonly id: IntegrationId

  /** Map a Gymbo-internal shape to an external payload. */
  toExternal: (
    internal: TInternal,
    ctx: IntegrationContext,
  ) => IntegrationResult<TExternal>
}

export type OutboundAdapterDefinition<TInternal, TExternal> = OutboundAdapter<
  TInternal,
  TExternal
>

export function defineOutboundAdapter<TInternal, TExternal>(
  adapter: OutboundAdapterDefinition<TInternal, TExternal>,
): OutboundAdapterDefinition<TInternal, TExternal> {
  return adapter
}
