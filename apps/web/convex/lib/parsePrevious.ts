/** Parses "60 kg x 8" style previous strings into weight/unit/reps. */
export function parsePrevious(
  previous: string
): { weight: string; unit: string; reps: string } | null {
  const match = previous.trim().match(/^([\d.]+)\s*(\w+)?\s*x\s*(.+)$/i)
  if (!match) return null

  return {
    weight: match[1],
    unit: match[2] || "kg",
    reps: match[3].trim(),
  }
}
