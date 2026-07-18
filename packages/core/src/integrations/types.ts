import type { IntegrationError } from "./errors"

declare const integrationIdBrand: unique symbol

export type IntegrationId = string & { readonly [integrationIdBrand]: true }

export function createIntegrationId(value: string): IntegrationId {
  if (value.trim().length === 0) {
    throw new Error("IntegrationId must be a non-empty string")
  }

  return value as IntegrationId
}

export type IntegrationContext = {
  integrationId: IntegrationId
  correlationId?: string
  /** Caller-supplied timestamp; the library does not call Date.now(). */
  occurredAt?: number
  metadata?: Readonly<Record<string, unknown>>
}

export type IntegrationResult<T, TError = IntegrationError> =
  | { ok: true; value: T }
  | { ok: false; error: TError }

export type IntegrationDirection = "inbound" | "outbound"
