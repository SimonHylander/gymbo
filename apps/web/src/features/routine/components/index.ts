import { RoutineProvider } from "@/features/routine/store/routine-session-context";
import { RoutineShell, RoutineMain } from "@/features/routine/components/routine-shell";
import { RoutineSidebar } from "@/features/routine/components/routine-sidebar";
import { RoutineHeader } from "@/features/routine/components/routine-header";
import { RoutineScrollContent } from "@/features/routine/components/routine-scroll-content";
import { RoutineExerciseStage } from "@/features/routine/components/routine-exercise-stage";
import { RoutineNoteFeed } from "@/features/routine/components/routine-note-feed";
import { RoutineNoteComposer } from "@/features/routine/components/routine-note-composer";
import { RestTimer } from "@/features/routine/components/exercise-card/rest-timer-bar";
import { RoutineSummary } from "@/features/routine/components/routine-summary";
import { RoutineSessionToolbar } from "@/features/routine/components/routine-session-toolbar";

export const Routine = {
  Provider: RoutineProvider,
  Shell: RoutineShell,
  Main: RoutineMain,
  Sidebar: RoutineSidebar,
  Header: RoutineHeader,
  ScrollContent: RoutineScrollContent,
  ExerciseStage: RoutineExerciseStage,
  NoteFeed: RoutineNoteFeed,
  NoteComposer: RoutineNoteComposer,
  RestTimer,
  Summary: RoutineSummary,
  SessionToolbar: RoutineSessionToolbar,
};

export { RoutineProvider } from "@/features/routine/store/routine-session-context";
