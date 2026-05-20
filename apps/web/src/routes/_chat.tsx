import { Outlet, createFileRoute } from "@tanstack/react-router"
import { Toaster } from "sonner"
import { AppSidebar } from "@/components/chat/app-sidebar"
import { DataStreamProvider } from "@/components/chat/data-stream-provider"
import { ChatShell } from "@/components/chat/shell"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { ActiveChatProvider } from "@/hooks/use-active-chat"
import { MOCK_USER } from "@/lib/mock-auth"

export const Route = createFileRoute("/_chat")({
  component: ChatLayout,
})

function getDefaultSidebarOpen() {
  if (typeof document === "undefined") {
    return true
  }

  return document.cookie
    .split("; ")
    .find((row) => row.startsWith("sidebar_state="))
    ?.split("=")[1] === "true"
}

function ChatLayout() {
  return (
    <>
      <script
        defer
        src="https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js"
      />
      <DataStreamProvider>
        <SidebarProvider defaultOpen={getDefaultSidebarOpen()}>
          <AppSidebar user={MOCK_USER} />
          <SidebarInset>
            <Toaster
              position="top-center"
              theme="system"
              toastOptions={{
                className:
                  "!bg-card !text-foreground !border-border/50 !shadow-[var(--shadow-float)]",
              }}
            />
            <ActiveChatProvider>
              <ChatShell />
            </ActiveChatProvider>
            <Outlet />
          </SidebarInset>
        </SidebarProvider>
      </DataStreamProvider>
    </>
  )
}
