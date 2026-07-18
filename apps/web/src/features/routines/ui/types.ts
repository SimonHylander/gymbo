import type {
  ExerciseCatalogItem,
  RoutineDetail,
  RoutineExerciseDraft,
  RoutineListProgram,
  RoutineSummary,
  SetTemplate,
} from "@workspace/domain/routines/domain/types";
import type { RepTargetFields } from "@workspace/domain/lib/rep-target";

export type RoutineListCardsViewProps = {
  programs: RoutineListProgram[];
  unassignedRoutines: RoutineSummary[];
  isLoading?: boolean;
};

export type RoutineDetailViewProps = {
  detail: RoutineDetail | null;
  hasOngoingWorkout: boolean;
  isLoading: boolean;
  isEditMode: boolean;
  editDisabledReason?: string;
  onEdit: () => void;
  onStartWorkout: () => void;
};

export type SetTemplateRowViewProps = {
  setNumber: number;
  template: SetTemplate;
  canRemove: boolean;
  onPreviousChange: (value: string) => void;
  onUnitChange: (value: string) => void;
  onRemove: () => void;
};

export type RoutineEditExerciseViewProps = {
  exercise: RoutineExerciseDraft;
  index: number;
  onNameChange?: never;
  onRepTargetChange: (value: RepTargetFields) => void;
  onRestChange: (seconds: number | undefined) => void;
  onNotesChange: (value: string) => void;
  onAddSet: () => void;
  onRemoveSet: (setIndex: number) => void;
  onSetTemplateChange: (
    setIndex: number,
    field: keyof SetTemplate,
    value: string
  ) => void;
  onRemoveExercise: () => void;
};

export type ExercisePickerViewProps = {
  options: ExerciseCatalogItem[];
  isLoading: boolean;
  onSelect: (item: ExerciseCatalogItem) => void;
  onSearchChange: (search: string) => void;
  search: string;
};

export type RoutineEditViewProps = {
  draft: { name: string; exercises: RoutineExerciseDraft[] };
  isSaving: boolean;
  catalogOptions: ExerciseCatalogItem[];
  catalogLoading: boolean;
  catalogSearch: string;
  onCatalogSearchChange: (search: string) => void;
  onNameChange: (name: string) => void;
  onSave: () => void;
  onCancel: () => void;
  onAddExercise: (item: ExerciseCatalogItem) => void;
  onRemoveExercise: (index: number) => void;
  onExerciseRepTargetChange: (index: number, value: RepTargetFields) => void;
  onExerciseRestChange: (index: number, seconds: number | undefined) => void;
  onExerciseNotesChange: (index: number, value: string) => void;
  onAddSet: (exerciseIndex: number) => void;
  onRemoveSet: (exerciseIndex: number, setIndex: number) => void;
  onSetTemplateChange: (
    exerciseIndex: number,
    setIndex: number,
    field: keyof SetTemplate,
    value: string
  ) => void;
};

export type RoutinesEmptyStateProps = {
  variant: "no-routines" | "invalid-routine";
};
