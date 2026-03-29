import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Toolbar } from "./Toolbar";
import { ArrangementPanel } from "@ui/arrangement";
import { InstrumentPanel } from "./panels";
import { MixerPanel } from "./mixer";
import { MediaPoolPanel } from "./media-pool/MediaPoolPanel";
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
import { sharedUndoManager } from "@state/undo/shared-undo-manager";
import { useSessionPersistence } from "@state/session/use-session-persistence";
import type { SessionStorage } from "@state/session/session-storage";
import { createDefaultSession } from "@state/session/session-schema";
import { hydrateStore } from "@state/session/use-session-persistence";
import { ErrorBoundary } from "./ErrorBoundary";
import { KeyboardShortcutsPanel } from "./keyboard/KeyboardShortcutsPanel";
import { ActionToast } from "./primitives/ActionToast";

function DawShellInner({
  sessionStorage,
}: {
  sessionStorage: SessionStorage;
}): React.JSX.Element {
  const registry = useMemo(() => new CommandRegistry(), []);
  const shortcuts = useMemo(() => new ShortcutMap(), []);
  const pool = useMediaPool();
  const undoManager = sharedUndoManager;
  const { saveNow, recoveryWarnings } = useSessionPersistence(sessionStorage);
  const [dismissed, setDismissed] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastCountRef = useRef(0);
  const showRecovery = !dismissed && recoveryWarnings.length > 0;

  const stableSaveNow = useCallback(() => saveNow(), [saveNow]);

  const showToast = useCallback((msg: string) => {
    toastCountRef.current += 1;
    setToastMessage(`${msg}#${String(toastCountRef.current)}`);
  }, []);

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
}: {
  sessionStorage: SessionStorage;
}): React.JSX.Element {
  return (
    <TransportProvider>
      <EffectsBridgeProvider>
        <RoutingBridgeProvider>
          <DawShellInner sessionStorage={sessionStorage} />
        </RoutingBridgeProvider>
      </EffectsBridgeProvider>
    </TransportProvider>
  );
}
