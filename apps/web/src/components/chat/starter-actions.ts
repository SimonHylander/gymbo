export type ChatStarterAction =
  | { kind: "prompt"; label: string; message: string }
  | { kind: "navigate"; label: string; to: "/routines" };

export const chatStarterActions: ChatStarterAction[] = [
  { kind: "navigate", label: "Start a workout", to: "/routines" },
  {
    kind: "prompt",
    label: "What's in my routine?",
    message: "What's in my routine?",
  },
  {
    kind: "prompt",
    label: "Help me log my sets",
    message: "Help me log my sets",
  },
  {
    kind: "prompt",
    label: "Review my last session",
    message: "Review my last session",
  },
];
