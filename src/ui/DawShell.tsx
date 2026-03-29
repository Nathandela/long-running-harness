import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Toolbar } from "./Toolbar";
import { ArrangementPanel } from "@ui/arrangement";
import { InstrumentPanel } from "./panels";
import { MixerPanel } from "./mixer";
import { MediaPoolPanel } from "./media-pool/MediaPoolPanel";
import { PianoRollEditor } from "@ui/piano-roll/PianoRollEditor";
import { CommandRegistry } from "./keyboard/command-registry";
import { ShortcutMap } from "./keyboard/shortcut-map";
import { useKeyboardShortcuts } from "./keyboard/useKeyboardShortcuts";
import { useTransportShortcuts } from "./transport/useTransportShortcuts";
import { useSessionShortcuts } from "./session/useSessionShortcuts";
import { RecoveryDialog } from "./session/RecoveryDialog";
import { TransportProvider } from "@audio/transport-provider";
import { EffectsBridgeProvider } from "@audio/effects/EffectsBridgeProvider";
import { RoutingBridgeProvider } from "@audio/mixer/RoutingBridgeProvider";
import { useMediaPool } from "@audio/media-pool/use-media-pool";
import { useDawStore } from "@state/store";
import { sharedUndoManager } from "@state/undo/shared-undo-manager";
import { useSessionPersistence } from "@state/session/use-session-persistence";
import type { SessionStorage } from "@state/session/session-storage";
import { createDefaultSession } from "@state/session/session-schema";
import { hydrateStore } from "@state/session/use-session-persistence";
import { ErrorBoundary } from "./ErrorBoundary";
import { KeyboardShortcutsPanel } from "./keyboard/KeyboardShortcutsPanel";
import { ActionToast } from "./primitives/ActionToast";

export type BottomPanelMode = "default" | "piano-roll";

function DawShellInner({
  sessionStorage,
  idbWarning,
}: {
  sessionStorage: SessionStorage;
  idbWarning: boolean;
}): React.JSX.Element {
  const registry = useMemo(() => new CommandRegistry(), []);
  const shortcuts = useMemo(() => new ShortcutMap(), []);
  const pool = useMediaPool();
  const undoManager = sharedUndoManager;
  const { saveNow, recoveryWarnings } = useSessionPersistence(sessionStorage);
  const [dismissed, setDismissed] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [bottomPanel, setBottomPanel] = useState<BottomPanelMode>("default");
  const [editingClipId, setEditingClipId] = useState<string | null>(null);

  const openPianoRoll = useCallback((clipId: string) => {
    setEditingClipId(clipId);
    setBottomPanel("piano-roll");
  }, []);

  const closePianoRoll = useCallback(() => {
    setEditingClipId(null);
    setBottomPanel("default");
  }, []);

  // If the editing clip was deleted (e.g. via undo), fall back to default panel
  const clipStillExists = useDawStore(
    (s) => editingClipId !== null && s.clips[editingClipId] !== undefined,
  );
  const effectivePanel: BottomPanelMode =
    bottomPanel === "piano-roll" && !clipStillExists ? "default" : bottomPanel;

  const toastCountRef = useRef(0);
  const showRecovery = !dismissed && recoveryWarnings.length > 0;

  const stableSaveNow = useCallback(() => saveNow(), [saveNow]);

  const showToast = useCallback((msg: string) => {
    toastCountRef.current += 1;
    setToastMessage(`${msg}#${String(toastCountRef.current)}`);
  }, []);

  useEffect(() => {
    if (idbWarning) {
      showToast("Storage unavailable -- changes won't persist");
    }
  }, [idbWarning, showToast]);

  useTransportShortcuts(registry, shortcuts);
  useSessionShortcuts(
    registry,
    shortcuts,
    undoManager,
    stableSaveNow,
    showToast,
  );

  useEffect(() => {
    registry.register({
      id: "app.shortcuts-legend",
      label: "Toggle Keyboard Shortcuts",
      execute: () => {
        setShortcutsOpen((prev) => !prev);
      },
    });
    shortcuts.bind({
      key: "?",
      shift: true,
      commandId: "app.shortcuts-legend",
    });
    return () => {
      registry.unregister("app.shortcuts-legend");
      shortcuts.unbind("app.shortcuts-legend");
    };
  }, [registry, shortcuts]);

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
      <ErrorBoundary fallbackLabel="Panel crashed">
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            overflow: "hidden",
          }}
        >
          <ArrangementPanel onOpenPianoRoll={openPianoRoll} />
          <MixerPanel />
          {effectivePanel === "piano-roll" ? (
            <div
              style={{ position: "relative", overflow: "hidden", height: 240 }}
            >
              <button
                type="button"
                data-testid="close-piano-roll"
                onClick={closePianoRoll}
                style={{
                  position: "absolute",
                  top: 4,
                  right: 8,
                  zIndex: 10,
                  background: "none",
                  border: "var(--border)",
                  color: "var(--color-gray-300)",
                  cursor: "pointer",
                  fontFamily: "var(--font-mono)",
                  fontSize: "var(--text-xs)",
                  padding: "2px 8px",
                }}
              >
                Close
              </button>
              <PianoRollEditor clipId={editingClipId} />
            </div>
          ) : (
            <div style={{ display: "flex", overflow: "hidden" }}>
              <div style={{ flex: 1 }}>
                <InstrumentPanel />
              </div>
              <div style={{ flex: 1 }}>
                <MediaPoolPanel pool={pool} />
              </div>
            </div>
          )}
        </div>
      </ErrorBoundary>
      <KeyboardShortcutsPanel
        open={shortcutsOpen}
        onClose={() => {
          setShortcutsOpen(false);
        }}
      />
      <RecoveryDialog
        open={showRecovery}
        warnings={recoveryWarnings}
        onAccept={() => {
          setDismissed(true);
        }}
        onDiscard={() => {
          hydrateStore(createDefaultSession());
          setDismissed(true);
        }}
      />
      <ActionToast message={toastMessage} />
    </div>
  );
}

export function DawShell({
  sessionStorage,
  idbWarning = false,
}: {
  sessionStorage: SessionStorage;
  idbWarning?: boolean;
}): React.JSX.Element {
  return (
    <TransportProvider>
      <EffectsBridgeProvider>
        <RoutingBridgeProvider>
          <DawShellInner
            sessionStorage={sessionStorage}
            idbWarning={idbWarning}
          />
        </RoutingBridgeProvider>
      </EffectsBridgeProvider>
    </TransportProvider>
  );
}
