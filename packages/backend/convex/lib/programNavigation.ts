export type RoutineSummary = {
  externalId: string
  name: string
}

export type ProgramMembership = {
  order: number
  routine: RoutineSummary
}

export function resolveNextRoutineMembership(
  currentOrder: number,
  memberships: Array<ProgramMembership>
): RoutineSummary | null {
  const next = memberships.find((membership) => membership.order === currentOrder + 1)
  return next?.routine ?? null
}
