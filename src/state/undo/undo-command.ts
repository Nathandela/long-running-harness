export type UndoCommand = {
  readonly type: string;
  execute(): void;
  undo(): void;
  serialize(): Record<string, unknown>;
};

/** Wraps multiple commands into a single undo/redo entry. */
export class BatchCommand implements UndoCommand {
  readonly type = "batch";

  constructor(private readonly commands: readonly UndoCommand[]) {}

  execute(): void {
    for (const cmd of this.commands) cmd.execute();
  }

  undo(): void {
    for (let i = this.commands.length - 1; i >= 0; i--) {
      const cmd = this.commands[i];
      if (cmd !== undefined) cmd.undo();
    }
  }

  serialize(): Record<string, unknown> {
    return { commands: this.commands.map((c) => c.serialize()) };
  }
}
