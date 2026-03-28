import { useMemo } from "react";
import { Toolbar } from "./Toolbar";
import { ArrangementPanel, MixerPanel, InstrumentPanel } from "./panels";
import { MediaPoolPanel } from "./media-pool/MediaPoolPanel";
import { CommandRegistry } from "./keyboard/command-registry";
import { ShortcutMap } from "./keyboard/shortcut-map";
import { useKeyboardShortcuts } from "./keyboard/useKeyboardShortcuts";
import { useTransportShortcuts } from "./transport/useTransportShortcuts";
import { TransportProvider } from "@audio/transport-provider";
import { useMediaPool } from "@audio/media-pool/use-media-pool";

function DawShellInner(): React.JSX.Element {
  const registry = useMemo(() => new CommandRegistry(), []);
  const shortcuts = useMemo(() => new ShortcutMap(), []);
  const pool = useMediaPool();

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
        <div style={{ display: "flex", overflow: "hidden" }}>
          <div style={{ flex: 1 }}>
            <InstrumentPanel />
          </div>
          <div style={{ flex: 1 }}>
            <MediaPoolPanel pool={pool} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function DawShell(): React.JSX.Element {
  return (
    <TransportProvider>
      <DawShellInner />
    </TransportProvider>
  );
}
