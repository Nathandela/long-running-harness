export type UndoCommand = {
  readonly type: string;
  execute(): void;
  undo(): void;
  serialize(): Record<string, unknown>;
};
