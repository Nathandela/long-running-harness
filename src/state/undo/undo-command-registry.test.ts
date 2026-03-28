import { describe, it, expect } from "vitest";
import { UndoCommandRegistry } from "./undo-command-registry";
import type { UndoCommand } from "./undo-command";

function makeCommand(type: string, value: number): UndoCommand {
  return {
    type,
    execute(): void {
      /* noop */
    },
    undo(): void {
      /* noop */
    },
    serialize(): Record<string, unknown> {
      return { value };
    },
  };
}

describe("UndoCommandRegistry", () => {
  it("registers and deserializes a command type", () => {
    const reg = new UndoCommandRegistry();
    reg.register("test.cmd", (data) =>
      makeCommand("test.cmd", data["value"] as number),
    );
    const cmd = reg.deserialize("test.cmd", { value: 42 });
    expect(cmd).toBeDefined();
    expect(cmd?.type).toBe("test.cmd");
    expect(cmd?.serialize()).toEqual({ value: 42 });
  });

  it("returns undefined for unknown type", () => {
    const reg = new UndoCommandRegistry();
    expect(reg.deserialize("unknown", {})).toBeUndefined();
  });

  it("unregisters a command type", () => {
    const reg = new UndoCommandRegistry();
    reg.register("test.cmd", (data) =>
      makeCommand("test.cmd", data["value"] as number),
    );
    reg.unregister("test.cmd");
    expect(reg.deserialize("test.cmd", { value: 1 })).toBeUndefined();
  });

  it("reports whether a type is registered", () => {
    const reg = new UndoCommandRegistry();
    expect(reg.has("test.cmd")).toBe(false);
    reg.register("test.cmd", () => makeCommand("test.cmd", 0));
    expect(reg.has("test.cmd")).toBe(true);
  });
});
