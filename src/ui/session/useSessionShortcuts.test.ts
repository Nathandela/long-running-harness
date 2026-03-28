import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { CommandRegistry } from "@ui/keyboard/command-registry";
import { ShortcutMap } from "@ui/keyboard/shortcut-map";
import { createUndoManager } from "@state/undo/index";
import { useSessionShortcuts } from "./useSessionShortcuts";

describe("useSessionShortcuts", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("registers undo, redo, and save commands", () => {
    const registry = new CommandRegistry();
    const shortcuts = new ShortcutMap();
    const undoManager = createUndoManager();
    const saveNow = vi.fn().mockResolvedValue(undefined);

    renderHook(() => {
      useSessionShortcuts(registry, shortcuts, undoManager, saveNow);
    });

    expect(registry.get("edit.undo")).toBeDefined();
    expect(registry.get("edit.redo")).toBeDefined();
    expect(registry.get("session.save")).toBeDefined();
  });

  it("binds Ctrl+Z to undo", () => {
    const registry = new CommandRegistry();
    const shortcuts = new ShortcutMap();
    const undoManager = createUndoManager();
    const saveNow = vi.fn().mockResolvedValue(undefined);

    renderHook(() => {
      useSessionShortcuts(registry, shortcuts, undoManager, saveNow);
    });

    const bindings = shortcuts.getBindingsForCommand("edit.undo");
    expect(bindings.some((b) => b.key === "z" && b.ctrl === true)).toBe(true);
  });

  it("binds Ctrl+Shift+Z to redo", () => {
    const registry = new CommandRegistry();
    const shortcuts = new ShortcutMap();
    const undoManager = createUndoManager();
    const saveNow = vi.fn().mockResolvedValue(undefined);

    renderHook(() => {
      useSessionShortcuts(registry, shortcuts, undoManager, saveNow);
    });

    const bindings = shortcuts.getBindingsForCommand("edit.redo");
    expect(
      bindings.some(
        (b) => b.key === "z" && b.ctrl === true && b.shift === true,
      ),
    ).toBe(true);
  });

  it("binds Ctrl+S to save", () => {
    const registry = new CommandRegistry();
    const shortcuts = new ShortcutMap();
    const undoManager = createUndoManager();
    const saveNow = vi.fn().mockResolvedValue(undefined);

    renderHook(() => {
      useSessionShortcuts(registry, shortcuts, undoManager, saveNow);
    });

    const bindings = shortcuts.getBindingsForCommand("session.save");
    expect(bindings.some((b) => b.key === "s" && b.ctrl === true)).toBe(true);
  });

  it("undo command calls undoManager.undo()", () => {
    const registry = new CommandRegistry();
    const shortcuts = new ShortcutMap();
    const undoManager = createUndoManager();
    const undoSpy = vi.spyOn(undoManager, "undo");
    const saveNow = vi.fn().mockResolvedValue(undefined);

    renderHook(() => {
      useSessionShortcuts(registry, shortcuts, undoManager, saveNow);
    });

    registry.execute("edit.undo");
    expect(undoSpy).toHaveBeenCalled();
  });

  it("unregisters on cleanup", () => {
    const registry = new CommandRegistry();
    const shortcuts = new ShortcutMap();
    const undoManager = createUndoManager();
    const saveNow = vi.fn().mockResolvedValue(undefined);

    const { unmount } = renderHook(() => {
      useSessionShortcuts(registry, shortcuts, undoManager, saveNow);
    });

    unmount();
    expect(registry.get("edit.undo")).toBeUndefined();
    expect(registry.get("edit.redo")).toBeUndefined();
    expect(registry.get("session.save")).toBeUndefined();
  });
});
