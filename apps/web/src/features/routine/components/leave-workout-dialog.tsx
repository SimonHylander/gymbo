import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type LeaveWorkoutDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmLeave: () => void;
  isSaving: boolean;
};

export function LeaveWorkoutDialog({
  open,
  onOpenChange,
  onConfirmLeave,
  isSaving,
}: LeaveWorkoutDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Leave workout?</AlertDialogTitle>
          <AlertDialogDescription>
            {isSaving
              ? "Your progress is saved automatically. You can return and pick up where you left off."
              : "You have not started logging yet. Leaving will discard any unsaved entries."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Stay</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirmLeave}>Leave</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
