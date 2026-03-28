import type { UndoCommand } from "./undo-command";

export type UndoCommandDeserializer = (
  data: Record<string, unknown>,
) => UndoCommand;

export class UndoCommandRegistry {
  private deserializers = new Map<string, UndoCommandDeserializer>();

  register(type: string, deserializer: UndoCommandDeserializer): void {
    this.deserializers.set(type, deserializer);
  }

  unregister(type: string): void {
    this.deserializers.delete(type);
  }

  deserialize(
    type: string,
    data: Record<string, unknown>,
  ): UndoCommand | undefined {
    const fn = this.deserializers.get(type);
    if (fn === undefined) return undefined;
    return fn(data);
  }

  has(type: string): boolean {
    return this.deserializers.has(type);
  }
}
