import type { ReactNode } from "react";

import { RoutineSidebar } from "@/features/routine/components/routine-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

type RoutineShellProps = {
  children: ReactNode;
};

export function RoutineShell({ children }: RoutineShellProps) {
  return (
    <SidebarProvider>
      <RoutineSidebar />
      <SidebarInset className="flex h-dvh flex-col bg-background">
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}

export function RoutineMain({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
