/**
 * Registers transport keyboard shortcuts (Space = play/stop toggle).
 */

import { useEffect, useRef } from "react";
import { useTransport } from "@audio/use-transport";
import { useDawStore } from "@state/index";
import type { CommandRegistry } from "@ui/keyboard/command-registry";
import type { ShortcutMap } from "@ui/keyboard/shortcut-map";

export function useTransportShortcuts(
  registry: CommandRegistry,
  shortcuts: ShortcutMap,
): void {
  const transport = useTransport();
  const transportState = useDawStore((s) => s.transportState);
  const stateRef = useRef(transportState);

  useEffect(() => {
    stateRef.current = transportState;
  }, [transportState]);

  useEffect(() => {
    registry.register({
      id: "transport.playStop",
      label: "Play / Stop",
      execute: () => {
        if (stateRef.current === "playing") {
          transport.stop();
        } else {
          transport.play();
        }
      },
    });

    shortcuts.bind({ key: " ", commandId: "transport.playStop" });

    return () => {
      registry.unregister("transport.playStop");
      shortcuts.unbind("transport.playStop");
    };
  }, [registry, shortcuts, transport]);
}
