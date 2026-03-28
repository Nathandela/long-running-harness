import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useTransportShortcuts } from "./useTransportShortcuts";
import { CommandRegistry } from "@ui/keyboard/command-registry";
import { ShortcutMap } from "@ui/keyboard/shortcut-map";

vi.mock("@audio/use-transport", () => ({
  useTransport: (): object => ({
    play: vi.fn(),
    pause: vi.fn(),
    stop: vi.fn(),
    seek: vi.fn(),
    setBpm: vi.fn(),
    setMetronomeEnabled: vi.fn(),
    getTransportSAB: vi.fn().mockReturnValue(null),
    getClock: vi.fn().mockReturnValue(null),
  }),
}));

describe("useTransportShortcuts", () => {
  let registry: CommandRegistry;
  let shortcuts: ShortcutMap;

  beforeEach(() => {
    registry = new CommandRegistry();
    shortcuts = new ShortcutMap();
  });

  it("registers transport.playStop command", () => {
    renderHook(() => {
      useTransportShortcuts(registry, shortcuts);
    });
    expect(registry.get("transport.playStop")).toBeDefined();
  });

  it("binds Space key to transport.playStop", () => {
    renderHook(() => {
      useTransportShortcuts(registry, shortcuts);
    });
    const bindings = shortcuts.getBindingsForCommand("transport.playStop");
    expect(bindings).toHaveLength(1);
    expect(bindings[0]?.key).toBe(" ");
  });

  it("unregisters commands on cleanup", () => {
    const { unmount } = renderHook(() => {
      useTransportShortcuts(registry, shortcuts);
    });
    unmount();
    expect(registry.get("transport.playStop")).toBeUndefined();
  });
});
