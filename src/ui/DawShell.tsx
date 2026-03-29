import { useCallback, useMemo, useState } from "react";
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
  const showRecovery = !dismissed && recoveryWarnings.length > 0;

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
