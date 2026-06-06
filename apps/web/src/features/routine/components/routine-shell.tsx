import type { ReactNode } from "react";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

type RoutineShellProps = {
  children: ReactNode;
};

export function RoutineShell({ children }: RoutineShellProps) {
  return <SidebarProvider>{children}</SidebarProvider>;
}

type RoutineMainProps = {
  children: ReactNode;
};

export function RoutineMain({ children }: RoutineMainProps) {
  return (
    <SidebarInset className="flex h-dvh flex-col bg-background">
      {children}
    </SidebarInset>
  );
}
