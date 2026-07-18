/** Server-side rep target validation (mirrors client lib/rep-target.ts). */

export type RepTargetFields = {
  reps?: number
  repRangeMin?: number
  repRangeMax?: number
}

export function validateRepTarget(fields: RepTargetFields): string | null {
  const hasReps = fields.reps !== undefined
  const hasMin = fields.repRangeMin !== undefined
  const hasMax = fields.repRangeMax !== undefined

  if (hasReps && (hasMin || hasMax)) {
    return "Use either a single rep count or a rep range, not both"
  }

  if (hasMin !== hasMax) {
    return "Rep range requires both min and max values"
  }

  if (hasMin && hasMax && fields.repRangeMin! > fields.repRangeMax!) {
    return "Rep range min cannot exceed max"
  }

  if (hasReps && fields.reps! < 0) {
    return "Rep count cannot be negative"
  }

  if (hasMin && fields.repRangeMin! < 0) {
    return "Rep range min cannot be negative"
  }

  if (hasMax && fields.repRangeMax! < 0) {
    return "Rep range max cannot be negative"
  }

  return null
}

/** Converts legacy `reps` values (number or string) to structured rep target fields. */
export function parseLegacyRepTarget(value: unknown): RepTargetFields {
  if (typeof value === "number" && Number.isFinite(value)) {
    return { reps: value }
  }
  if (typeof value !== "string") {
    return {}
  }
  const trimmed = value.trim()
  const rangeMatch = trimmed.match(/^(\d+)\s*[-–]\s*(\d+)$/)
  if (rangeMatch) {
    return {
      repRangeMin: Number.parseInt(rangeMatch[1], 10),
      repRangeMax: Number.parseInt(rangeMatch[2], 10),
    }
  }
  if (/^\d+$/.test(trimmed)) {
    return { reps: Number.parseInt(trimmed, 10) }
  }
  return {}
}

/** @deprecated Use parseLegacyRepTarget */
export function parseLegacyRepsString(value: unknown): number | undefined {
  return parseLegacyRepTarget(value).reps
}

export function formatRepTargetLabel(fields: RepTargetFields): string | null {
  if (fields.repRangeMin !== undefined && fields.repRangeMax !== undefined) {
    return `${fields.repRangeMin}–${fields.repRangeMax}`
  }
  if (fields.reps !== undefined) {
    return String(fields.reps)
  }
  return null
}
