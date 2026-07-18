import { IntegrationErrorCode, createIntegrationError } from "./errors"
import type { IntegrationError } from "./errors"
import type { IntegrationResult } from "./types"

export function integrationOk<T, TError = IntegrationError>(
  value: T,
): IntegrationResult<T, TError> {
  return { ok: true, value }
}

export function integrationErr<TError extends IntegrationError = IntegrationError>(
  error: TError,
): IntegrationResult<never, TError> {
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

export function mapIntegrationResult<T, TMapped, TError extends IntegrationError = IntegrationError>(
  result: IntegrationResult<T, TError>,
  map: (value: T) => TMapped,
): IntegrationResult<TMapped, TError> {
  if (!result.ok) {
    return result
  }

  return integrationOk(map(result.value))
}

export function flatMapIntegrationResult<T, TMapped, TError extends IntegrationError = IntegrationError>(
  result: IntegrationResult<T, TError>,
  map: (value: T) => IntegrationResult<TMapped, TError>,
): IntegrationResult<TMapped, TError> {
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
