import { createIntegrationError, IntegrationErrorCode } from "./errors"
import type { IntegrationError } from "./errors"
import type { IntegrationResult } from "./types"

export function integrationOk<T, E = IntegrationError>(
  value: T,
): IntegrationResult<T, E> {
  return { ok: true, value }
}

export function integrationErr<E extends IntegrationError = IntegrationError>(
  error: E,
): IntegrationResult<never, E> {
  return { ok: false, error }
}

export function integrationNotFound(
  message: string,
  details?: Readonly<Record<string, unknown>>,
): IntegrationResult<never> {
  return integrationErr(
    createIntegrationError(IntegrationErrorCode.NotFound, message, { details }),
  )
}

export function integrationDuplicateRegistration(
  message: string,
  details?: Readonly<Record<string, unknown>>,
): IntegrationResult<never> {
  return integrationErr(
    createIntegrationError(IntegrationErrorCode.DuplicateRegistration, message, {
      details,
    }),
  )
}

export function mapIntegrationResult<T, U, E extends IntegrationError = IntegrationError>(
  result: IntegrationResult<T, E>,
  map: (value: T) => U,
): IntegrationResult<U, E> {
  if (!result.ok) {
    return result
  }

  return integrationOk(map(result.value))
}

export function flatMapIntegrationResult<T, U, E extends IntegrationError = IntegrationError>(
  result: IntegrationResult<T, E>,
  map: (value: T) => IntegrationResult<U, E>,
): IntegrationResult<U, E> {
  if (!result.ok) {
    return result
  }

  return map(result.value)
}

export function unwrapIntegrationResult<T>(
  result: IntegrationResult<T>,
  fallbackMessage = "Integration operation failed",
): T {
  if (result.ok) {
    return result.value
  }

  throw new Error(result.error.message || fallbackMessage, { cause: result.error })
}
