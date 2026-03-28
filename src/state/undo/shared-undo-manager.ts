import { createUndoManager } from "./undo-manager";

/** Singleton undo manager shared across the application. */
export const sharedUndoManager = createUndoManager();
