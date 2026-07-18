import { ConvexError } from "convex/values";

import type { RoutineTemplateDraft } from "@workspace/domain/routines/domain/types";
import { draftToUpdateArgs } from "@workspace/domain/routines/domain/map-routine-template";

export type SaveRoutineTemplateFn = (args: ReturnType<typeof draftToUpdateArgs>) => Promise<null>;

export type SaveResult =
  | { ok: true }
  | { ok: false; message: string; code?: string };

export function mapConvexError(error: unknown): SaveResult {
  if (error instanceof ConvexError) {
    const data = error.data as { code?: string; message?: string };
    const code = data?.code;
    const message =
      code === "WORKOUT_ONGOING"
        ? "Finish or leave the workout before editing this routine."
        : code === "NOT_FOUND"
          ? "Routine not found."
          : code === "VALIDATION_ERROR"
            ? (data.message ?? "Invalid routine template.")
            : (data?.message ?? "Failed to save routine.");
    return { ok: false, message, code };
  }
  if (error instanceof Error) {
    return { ok: false, message: error.message };
  }
  return { ok: false, message: "Failed to save routine." };
}

export async function saveRoutineTemplate(
  mutate: SaveRoutineTemplateFn,
  draft: RoutineTemplateDraft
): Promise<SaveResult> {
  try {
    await mutate(draftToUpdateArgs(draft));
    return { ok: true };
  } catch (error) {
    return mapConvexError(error);
  }
}
