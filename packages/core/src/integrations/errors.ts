export const IntegrationErrorCode = {
  NotFound: "NOT_FOUND",
  ParseFailed: "PARSE_FAILED",
  MappingFailed: "MAPPING_FAILED",
  ValidationFailed: "VALIDATION_FAILED",
  DuplicateRegistration: "DUPLICATE_REGISTRATION",
} as const

export type IntegrationErrorCode =
  (typeof IntegrationErrorCode)[keyof typeof IntegrationErrorCode]

export type IntegrationError = {
  code: IntegrationErrorCode
  message: string
  cause?: unknown
  details?: Readonly<Record<string, unknown>>
}

export function createIntegrationError(
  code: IntegrationErrorCode,
  message: string,
  options?: {
    cause?: unknown
    details?: Readonly<Record<string, unknown>>
  },
): IntegrationError {
  return {
    code,
    message,
    cause: options?.cause,
    details: options?.details,
  }
}
