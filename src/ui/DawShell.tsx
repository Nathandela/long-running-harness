import { useCallback, useMemo, useState } from "react";
import { Toolbar } from "./Toolbar";
import { ArrangementPanel, MixerPanel, InstrumentPanel } from "./panels";
import { MediaPoolPanel } from "./media-pool/MediaPoolPanel";
import { CommandRegistry } from "./keyboard/command-registry";
import { ShortcutMap } from "./keyboard/shortcut-map";
import { useKeyboardShortcuts } from "./keyboard/useKeyboardShortcuts";
import { useTransportShortcuts } from "./transport/useTransportShortcuts";
import { useSessionShortcuts } from "./session/useSessionShortcuts";
import { RecoveryDialog } from "./session/RecoveryDialog";
import { TransportProvider } from "@audio/transport-provider";
import { useMediaPool } from "@audio/media-pool/use-media-pool";
import { createUndoManager } from "@state/undo/index";
import { useSessionPersistence } from "@state/session/use-session-persistence";
import { createInMemorySessionStorage } from "@state/session/index";

// Use in-memory storage until IndexedDB is wired in App-level provider
const defaultStorage = createInMemorySessionStorage();

function DawShellInner(): React.JSX.Element {
  const registry = useMemo(() => new CommandRegistry(), []);
  const shortcuts = useMemo(() => new ShortcutMap(), []);
  const pool = useMediaPool();
  const undoManager = useMemo(() => createUndoManager(), []);
  const { saveNow, recoveryWarnings } = useSessionPersistence(defaultStorage);
  const [showRecovery, setShowRecovery] = useState(recoveryWarnings.length > 0);

  const stableSaveNow = useCallback(() => saveNow(), [saveNow]);

  useTransportShortcuts(registry, shortcuts);
  useSessionShortcuts(registry, shortcuts, undoManager, stableSaveNow);
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
      <RecoveryDialog
        open={showRecovery}
        warnings={recoveryWarnings}
        onAccept={() => {
          setShowRecovery(false);
        }}
        onDiscard={() => {
          setShowRecovery(false);
        }}
      />
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
