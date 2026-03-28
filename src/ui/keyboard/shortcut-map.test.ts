import { describe, it, expect } from "vitest";
import { ShortcutMap } from "./shortcut-map";

function makeKeyboardEvent(
  key: string,
  modifiers: {
    ctrlKey?: boolean;
    shiftKey?: boolean;
    altKey?: boolean;
    metaKey?: boolean;
  } = {},
): KeyboardEvent {
  return new KeyboardEvent("keydown", {
    key,
    ctrlKey: modifiers.ctrlKey === true,
    shiftKey: modifiers.shiftKey === true,
    altKey: modifiers.altKey === true,
    metaKey: modifiers.metaKey === true,
  });
}

describe("ShortcutMap", () => {
  it("binds and resolves a simple key", () => {
    const map = new ShortcutMap();
    map.bind({ key: "Space", commandId: "transport.play" });

    const result = map.resolve(makeKeyboardEvent(" "));

    expect(result).toBe("transport.play");
  });

  it("resolves with modifier keys (Ctrl+Z)", () => {
    const map = new ShortcutMap();
    map.bind({ key: "z", ctrl: true, commandId: "edit.undo" });

    const result = map.resolve(makeKeyboardEvent("z", { ctrlKey: true }));

    expect(result).toBe("edit.undo");
  });

  it("returns undefined for unbound key", () => {
    const map = new ShortcutMap();

    const result = map.resolve(makeKeyboardEvent("q"));

    expect(result).toBeUndefined();
  });

  it("does not resolve if modifiers do not match", () => {
    const map = new ShortcutMap();
    map.bind({ key: "z", ctrl: true, commandId: "edit.undo" });

    // Press z without Ctrl
    const result = map.resolve(makeKeyboardEvent("z"));

    expect(result).toBeUndefined();
  });

  it("unbinds a command's shortcuts", () => {
    const map = new ShortcutMap();
    map.bind({ key: "z", ctrl: true, commandId: "edit.undo" });
    map.bind({ key: "z", ctrl: true, shift: true, commandId: "edit.undo" });

    map.unbind("edit.undo");

    const result = map.resolve(makeKeyboardEvent("z", { ctrlKey: true }));
    expect(result).toBeUndefined();
  });

  it("getBindingsForCommand returns correct bindings", () => {
    const map = new ShortcutMap();
    map.bind({ key: "z", ctrl: true, commandId: "edit.undo" });
    map.bind({ key: "s", ctrl: true, commandId: "file.save" });

    const bindings = map.getBindingsForCommand("edit.undo");

    expect(bindings).toHaveLength(1);
    expect(bindings[0]?.key).toBe("z");
  });

  it("getAll returns all bindings", () => {
    const map = new ShortcutMap();
    map.bind({ key: "z", ctrl: true, commandId: "edit.undo" });
    map.bind({ key: "s", ctrl: true, commandId: "file.save" });

    const all = map.getAll();

    expect(all).toHaveLength(2);
  });
});
