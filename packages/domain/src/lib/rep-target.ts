export type RepTargetMode = "single" | "range";

export type RepTargetFields = {
  reps?: number;
  repRangeMin?: number;
  repRangeMax?: number;
};

export function deriveRepTargetMode(fields: RepTargetFields): RepTargetMode {
  if (fields.repRangeMin !== undefined || fields.repRangeMax !== undefined) {
    return "range";
  }
  return "single";
}

export function formatRepTargetLabel(fields: RepTargetFields): string | null {
  if (fields.repRangeMin !== undefined && fields.repRangeMax !== undefined) {
    return `${fields.repRangeMin}–${fields.repRangeMax}`;
  }
  if (fields.reps !== undefined) {
    return String(fields.reps);
  }
  return null;
}

export function normalizeRepTargetForSave(
  mode: RepTargetMode,
  values: RepTargetFields
): RepTargetFields {
  if (mode === "range") {
    return {
      repRangeMin: values.repRangeMin,
      repRangeMax: values.repRangeMax,
    };
  }
  return { reps: values.reps };
}

export function parseRepInput(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number.parseInt(trimmed, 10);
  if (!Number.isFinite(parsed) || parsed < 0) return undefined;
  return parsed;
}

export function validateRepTarget(fields: RepTargetFields): string | null {
  const hasReps = fields.reps !== undefined;
  const hasMin = fields.repRangeMin !== undefined;
  const hasMax = fields.repRangeMax !== undefined;

  if (hasReps && (hasMin || hasMax)) {
    return "Use either a single rep count or a rep range, not both";
  }

  if (hasMin !== hasMax) {
    return "Rep range requires both min and max values";
  }

  if (
    hasMin &&
    hasMax &&
    fields.repRangeMin! > fields.repRangeMax!
  ) {
    return "Rep range min cannot exceed max";
  }

  if (hasReps && fields.reps! < 0) {
    return "Rep count cannot be negative";
  }

  if (hasMin && fields.repRangeMin! < 0) {
    return "Rep range min cannot be negative";
  }

  if (hasMax && fields.repRangeMax! < 0) {
    return "Rep range max cannot be negative";
  }

  return null;
}
