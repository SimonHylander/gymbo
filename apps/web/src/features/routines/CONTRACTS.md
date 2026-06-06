# Routines feature contracts

## Convex API

### programs.listWithRoutines
- Args: `{}`
- Returns:
```ts
{
  programs: Array<{
    externalId: string
    name: string
    routines: Array<{
      externalId: string
      name: string
      exerciseCount: number
      hasOngoingWorkout: boolean
    }>
  }>
  unassignedRoutines: Array<{ ...same as routine item }>
}
```

### exercises.list
- Args: `{ search?: string }`
- Returns: `Array<{ externalId: string; name: string }>` (max 50)

### routines.getByExternalId
- Args: `{ externalId: string }`
- Returns: existing shape (unchanged)

### routines.updateTemplate
- Args:
```ts
{
  externalId: string
  name: string
  exercises: Array<{
    externalId: string
    exerciseExternalId: string
    order: number
    reps?: number
    repRangeMin?: number
    repRangeMax?: number
    restSeconds?: number
    notes?: string
    setTemplates: Array<{ previous: string; unit: string }>
  }>
}
```
- Returns: `null`

## ConvexError codes

| Code | When |
|------|------|
| `NOT_FOUND` | Unknown routine externalId |
| `WORKOUT_ONGOING` | Edit blocked during active session |
| `VALIDATION_ERROR` | Invalid template payload |

## Query keys (adapters/query-keys.ts)

```ts
routinesQueries.list()
routinesQueries.detail(externalId)
routinesQueries.ongoing(externalId)
routinesQueries.catalog(search?)
```
