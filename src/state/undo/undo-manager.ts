import type { UndoCommand } from "./undo-command";

const DEFAULT_MAX_SIZE = 200;

export type UndoManager = {
  push(command: UndoCommand): void;
  undo(): boolean;
  redo(): boolean;
  clear(): void;
  readonly canUndo: boolean;
  readonly canRedo: boolean;
  readonly undoStack: readonly UndoCommand[];
  readonly redoStack: readonly UndoCommand[];
  readonly size: number;
};

export function createUndoManager(
  maxSize: number = DEFAULT_MAX_SIZE,
): UndoManager {
  const undoStack: UndoCommand[] = [];
  const redoStack: UndoCommand[] = [];

  return {
    push(command: UndoCommand): void {
      undoStack.push(command);
      redoStack.length = 0;
      while (undoStack.length > maxSize) {
        undoStack.shift();
      }
    },

    undo(): boolean {
      const cmd = undoStack.pop();
      if (cmd === undefined) return false;
      cmd.undo();
      redoStack.push(cmd);
      return true;
    },

    redo(): boolean {
      const cmd = redoStack.pop();
      if (cmd === undefined) return false;
      cmd.execute();
      undoStack.push(cmd);
      return true;
    },

    clear(): void {
      undoStack.length = 0;
      redoStack.length = 0;
    },

    get canUndo(): boolean {
      return undoStack.length > 0;
    },

    get canRedo(): boolean {
      return redoStack.length > 0;
    },

    get undoStack(): readonly UndoCommand[] {
      return undoStack;
    },

    get redoStack(): readonly UndoCommand[] {
      return redoStack;
    },

    get size(): number {
      return undoStack.length;
    },
  };
}
