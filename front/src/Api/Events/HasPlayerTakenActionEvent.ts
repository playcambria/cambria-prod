import { z } from "zod";

export const hasPlayerTakenActionEvent = z.object({
    action: z.string(),
    effect: z.string(),
    duration: z.number(),
    targetId: z.number(),
});

/**
 * A message sent from the game to the iFrame to notify a movement from the current player.
 */
export type HasPlayerTakenActionEvent = z.infer<typeof hasPlayerTakenActionEvent>;

export type HasPlayerTakenActionEventCallback = (event: HasPlayerTakenActionEvent) => void;
