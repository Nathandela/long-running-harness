export type Command = {
  id: string;
  label: string;
  execute: () => void;
  enabled?: () => boolean;
};

export class CommandRegistry {
  private commands = new Map<string, Command>();

  register(command: Command): void {
    this.commands.set(command.id, command);
  }

  unregister(id: string): void {
    this.commands.delete(id);
  }

  execute(id: string): boolean {
    const command = this.commands.get(id);
    if (command === undefined) {
      return false;
    }
    if (command.enabled !== undefined && !command.enabled()) {
      return false;
    }
    command.execute();
    return true;
  }

  getAll(): readonly Command[] {
    return [...this.commands.values()];
  }

  get(id: string): Command | undefined {
    return this.commands.get(id);
  }
}
