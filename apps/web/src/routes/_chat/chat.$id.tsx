import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/_chat/chat/$id")({
  component: EmptyRoute,
})

function EmptyRoute() {
  return null
}
