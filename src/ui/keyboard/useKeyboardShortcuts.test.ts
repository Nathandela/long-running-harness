import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import { CommandRegistry } from "./command-registry";
import { ShortcutMap } from "./shortcut-map";
import { useKeyboardShortcuts } from "./useKeyboardShortcuts";

function setup(): { registry: CommandRegistry; shortcuts: ShortcutMap } {
  const registry = new CommandRegistry();
  const shortcuts = new ShortcutMap();
  return { registry, shortcuts };
}

describe("useKeyboardShortcuts", () => {
  it("calls command when matching shortcut is pressed", () => {
    const { registry, shortcuts } = setup();
    const execute = vi.fn();
    registry.register({ id: "transport.play", label: "Play", execute });
    shortcuts.bind({ key: " ", commandId: "transport.play" });

    renderHook(() => {
      useKeyboardShortcuts(registry, shortcuts);
    });

    fireEvent.keyDown(document, { key: " " });

    expect(execute).toHaveBeenCalledOnce();
  });

  it("does not call command when focus is in input element", () => {
    const { registry, shortcuts } = setup();
    const execute = vi.fn();
    registry.register({ id: "transport.play", label: "Play", execute });
    shortcuts.bind({ key: " ", commandId: "transport.play" });

    renderHook(() => {
      useKeyboardShortcuts(registry, shortcuts);
    });

    const input = document.createElement("input");
    document.body.appendChild(input);

    fireEvent.keyDown(input, { key: " " });

    expect(execute).not.toHaveBeenCalled();

    document.body.removeChild(input);
  });

  it("does not call command for unbound key", () => {
    const { registry, shortcuts } = setup();
    const execute = vi.fn();
    registry.register({ id: "transport.play", label: "Play", execute });
    shortcuts.bind({ key: " ", commandId: "transport.play" });

    renderHook(() => {
      useKeyboardShortcuts(registry, shortcuts);
    });

    fireEvent.keyDown(document, { key: "q" });

    expect(execute).not.toHaveBeenCalled();
  });

  it("cleans up listener on unmount", () => {
    const { registry, shortcuts } = setup();
    const execute = vi.fn();
    registry.register({ id: "transport.play", label: "Play", execute });
    shortcuts.bind({ key: " ", commandId: "transport.play" });

    const { unmount } = renderHook(() => {
      useKeyboardShortcuts(registry, shortcuts);
    });

    unmount();

    fireEvent.keyDown(document, { key: " " });

    expect(execute).not.toHaveBeenCalled();
  });
});
