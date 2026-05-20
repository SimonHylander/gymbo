import { API_BASE } from "@/lib/api-base"
import type { Suggestion } from "@/lib/db/schema"

export async function getSuggestions({ documentId }: { documentId: string }) {
  const response = await fetch(`${API_BASE}/api/suggestions?id=${documentId}`)
  const json = await response.json()
  return (json.suggestions ?? []) as Suggestion[]
}
