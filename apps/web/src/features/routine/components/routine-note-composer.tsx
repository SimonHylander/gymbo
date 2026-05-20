import { SendIcon } from "lucide-react";

import {
  useRoutineActions,
  useRoutineMeta,
  useRoutineSession,
} from "@/features/routine/store/routine-session-context";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function RoutineNoteComposer() {
  const noteDraft = useRoutineSession((state) => state.noteDraft);
  const { sendNote, setNoteDraft } = useRoutineActions();
  const { inputRef, scrollToBottom } = useRoutineMeta();

  const handleSend = () => {
    sendNote();
    inputRef.current?.focus();
    setTimeout(scrollToBottom, 50);
  };

  return (
    <div className="shrink-0 border-t border-border/40 bg-background px-4 py-3">
      <div className="mx-auto flex max-w-2xl items-end gap-2">
        <Textarea
          ref={inputRef}
          placeholder="Add a note or comment…"
          value={noteDraft}
          onChange={(e) => setNoteDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          className="min-h-0 py-2.5"
          rows={1}
        />
        <Button
          onClick={handleSend}
          disabled={!noteDraft.trim()}
          size="icon-sm"
        >
          <SendIcon className="size-4" />
        </Button>
      </div>
    </div>
  );
}
