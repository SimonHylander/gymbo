import { useRoutineSession } from "@/features/routine/store/routine-session-context";

function UserBubble({ text }: { text: string }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground">
        {text}
      </div>
    </div>
  );
}

export function RoutineNoteFeed() {
  const notes = useRoutineSession((state) => state.notes);

  return (
    <>
      {notes.map((note) => (
        <UserBubble key={note.id} text={note.text} />
      ))}
    </>
  );
}
