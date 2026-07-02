import type { IntegrationContext, IntegrationId, IntegrationResult } from "./types"

export interface InboundAdapter<TExternal, TInternal> {
  readonly id: IntegrationId

  /** Validate and normalize untrusted input (webhook body, import row, etc.). */
  parse(input: unknown, ctx: IntegrationContext): IntegrationResult<TExternal>

  /** Map a validated external shape to a Gymbo-internal shape. */
  toInternal(
    external: TExternal,
    ctx: IntegrationContext,
  ): IntegrationResult<TInternal>
}

export type InboundAdapterDefinition<TExternal, TInternal> = InboundAdapter<
  TExternal,
  TInternal
>

export function defineInboundAdapter<TExternal, TInternal>(
  adapter: InboundAdapterDefinition<TExternal, TInternal>,
): InboundAdapterDefinition<TExternal, TInternal> {
  return adapter
}
