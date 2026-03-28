export type ShortcutBinding = {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  commandId: string;
};

function normalizeKey(key: string): string {
  return key === " " ? "space" : key.toLowerCase();
}

export class ShortcutMap {
  private bindings: ShortcutBinding[] = [];

  bind(binding: ShortcutBinding): void {
    this.bindings.push(binding);
  }

  unbind(commandId: string): void {
    this.bindings = this.bindings.filter((b) => b.commandId !== commandId);
  }

  resolve(event: KeyboardEvent): string | undefined {
    const eventKey = normalizeKey(event.key);
    const match = this.bindings.find(
      (b) =>
        normalizeKey(b.key) === eventKey &&
        (b.ctrl === true) === event.ctrlKey &&
        (b.shift === true) === event.shiftKey &&
        (b.alt === true) === event.altKey &&
        (b.meta === true) === event.metaKey,
    );
    return match?.commandId;
  }

  getBindingsForCommand(commandId: string): ShortcutBinding[] {
    return this.bindings.filter((b) => b.commandId === commandId);
  }

  getAll(): readonly ShortcutBinding[] {
    return [...this.bindings];
  }
}
