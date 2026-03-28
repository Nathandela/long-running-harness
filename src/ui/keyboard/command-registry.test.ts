import { describe, it, expect, vi } from "vitest";
import { CommandRegistry } from "./command-registry";
import type { Command } from "./command-registry";

function makeCommand(overrides: Partial<Command> = {}): Command {
  return {
    id: "test.command",
    label: "Test Command",
    execute: vi.fn(),
    ...overrides,
  };
}

describe("CommandRegistry", () => {
  it("registers and retrieves a command", () => {
    const registry = new CommandRegistry();
    const cmd = makeCommand({ id: "play" });

    registry.register(cmd);

    expect(registry.get("play")).toBe(cmd);
  });

  it("executes a registered command", () => {
    const registry = new CommandRegistry();
    const execute = vi.fn();
    registry.register(makeCommand({ id: "play", execute }));

    const result = registry.execute("play");

    expect(result).toBe(true);
    expect(execute).toHaveBeenCalledOnce();
  });

  it("returns false for unknown command", () => {
    const registry = new CommandRegistry();

    const result = registry.execute("nonexistent");

    expect(result).toBe(false);
  });

  it("returns false for disabled command", () => {
    const registry = new CommandRegistry();
    const execute = vi.fn();
    registry.register(
      makeCommand({ id: "play", execute, enabled: () => false }),
    );

    const result = registry.execute("play");

    expect(result).toBe(false);
    expect(execute).not.toHaveBeenCalled();
  });

  it("unregisters a command", () => {
    const registry = new CommandRegistry();
    registry.register(makeCommand({ id: "play" }));

    registry.unregister("play");

    expect(registry.get("play")).toBeUndefined();
  });

  it("getAll returns all registered commands", () => {
    const registry = new CommandRegistry();
    const cmd1 = makeCommand({ id: "play", label: "Play" });
    const cmd2 = makeCommand({ id: "stop", label: "Stop" });
    registry.register(cmd1);
    registry.register(cmd2);

    const all = registry.getAll();

    expect(all).toHaveLength(2);
    expect(all).toContain(cmd1);
    expect(all).toContain(cmd2);
  });
});
