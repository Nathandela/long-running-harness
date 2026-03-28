import { describe, it, expect } from "vitest";
import { createUndoManager } from "./undo-manager";
import type { UndoCommand } from "./undo-command";

function makeTracker(): {
  history: string[];
  command(label: string): UndoCommand;
} {
  const history: string[] = [];
  return {
    history,
    command(label: string): UndoCommand {
      return {
        type: "test",
        execute(): void {
          history.push(`exec:${label}`);
        },
        undo(): void {
          history.push(`undo:${label}`);
        },
        serialize(): Record<string, unknown> {
          return { label };
        },
      };
    },
  };
}

describe("UndoManager", () => {
  it("starts empty", () => {
    const mgr = createUndoManager();
    expect(mgr.canUndo).toBe(false);
    expect(mgr.canRedo).toBe(false);
    expect(mgr.size).toBe(0);
  });

  it("push adds to undo stack", () => {
    const mgr = createUndoManager();
    const t = makeTracker();
    mgr.push(t.command("a"));
    expect(mgr.canUndo).toBe(true);
    expect(mgr.size).toBe(1);
  });

  it("undo calls command.undo()", () => {
    const mgr = createUndoManager();
    const t = makeTracker();
    mgr.push(t.command("a"));
    const result = mgr.undo();
    expect(result).toBe(true);
    expect(t.history).toContain("undo:a");
    expect(mgr.canUndo).toBe(false);
    expect(mgr.canRedo).toBe(true);
  });

  it("redo calls command.execute()", () => {
    const mgr = createUndoManager();
    const t = makeTracker();
    mgr.push(t.command("a"));
    mgr.undo();
    const result = mgr.redo();
    expect(result).toBe(true);
    expect(t.history).toContain("exec:a");
    expect(mgr.canUndo).toBe(true);
    expect(mgr.canRedo).toBe(false);
  });

  it("push clears redo stack", () => {
    const mgr = createUndoManager();
    const t = makeTracker();
    mgr.push(t.command("a"));
    mgr.undo();
    expect(mgr.canRedo).toBe(true);
    mgr.push(t.command("b"));
    expect(mgr.canRedo).toBe(false);
  });

  it("undo on empty returns false", () => {
    const mgr = createUndoManager();
    expect(mgr.undo()).toBe(false);
  });

  it("redo on empty returns false", () => {
    const mgr = createUndoManager();
    expect(mgr.redo()).toBe(false);
  });

  it("bounds at maxSize (drops oldest)", () => {
    const mgr = createUndoManager(3);
    const t = makeTracker();
    mgr.push(t.command("a"));
    mgr.push(t.command("b"));
    mgr.push(t.command("c"));
    mgr.push(t.command("d"));
    expect(mgr.size).toBe(3);
    // "a" was evicted, undo should give d, c, b
    mgr.undo(); // undo d
    mgr.undo(); // undo c
    mgr.undo(); // undo b
    expect(mgr.undo()).toBe(false); // a was evicted
  });

  it("clear empties both stacks", () => {
    const mgr = createUndoManager();
    const t = makeTracker();
    mgr.push(t.command("a"));
    mgr.push(t.command("b"));
    mgr.undo();
    mgr.clear();
    expect(mgr.canUndo).toBe(false);
    expect(mgr.canRedo).toBe(false);
    expect(mgr.size).toBe(0);
  });

  it("exposes readonly stacks", () => {
    const mgr = createUndoManager();
    const t = makeTracker();
    mgr.push(t.command("a"));
    mgr.push(t.command("b"));
    mgr.undo();
    expect(mgr.undoStack).toHaveLength(1);
    expect(mgr.redoStack).toHaveLength(1);
  });

  it("defaults maxSize to 200", () => {
    const mgr = createUndoManager();
    const t = makeTracker();
    for (let i = 0; i < 210; i++) {
      mgr.push(t.command(`cmd-${String(i)}`));
    }
    expect(mgr.size).toBe(200);
  });
});
