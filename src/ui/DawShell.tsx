import { useMemo } from "react";
import { Toolbar } from "./Toolbar";
import { ArrangementPanel, MixerPanel, InstrumentPanel } from "./panels";
import { CommandRegistry } from "./keyboard/command-registry";
import { ShortcutMap } from "./keyboard/shortcut-map";
import { useKeyboardShortcuts } from "./keyboard/useKeyboardShortcuts";
import { useTransportShortcuts } from "./transport/useTransportShortcuts";

export function DawShell(): React.JSX.Element {
  const registry = useMemo(() => new CommandRegistry(), []);
  const shortcuts = useMemo(() => new ShortcutMap(), []);

  useTransportShortcuts(registry, shortcuts);
  useKeyboardShortcuts(registry, shortcuts);

  return (
    <div
      data-testid="daw-shell"
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        backgroundColor: "var(--color-black)",
      }}
    >
      <Toolbar />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          overflow: "hidden",
        }}
      >
        <ArrangementPanel />
        <MixerPanel />
        <InstrumentPanel />
      </div>
    </div>
  );
}
