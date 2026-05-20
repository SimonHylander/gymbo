import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/_chat/")({
  component: EmptyRoute,
})

function EmptyRoute() {
  return null
}
