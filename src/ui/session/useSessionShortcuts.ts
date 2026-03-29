import { useEffect } from "react";
import type { CommandRegistry } from "@ui/keyboard/command-registry";
import type { ShortcutMap } from "@ui/keyboard/shortcut-map";
import type { UndoManager } from "@state/undo/index";

export function useSessionShortcuts(
  registry: CommandRegistry,
  shortcuts: ShortcutMap,
  undoManager: UndoManager,
  saveNow: () => Promise<void>,
  onActionFeedback?: (message: string) => void,
): void {
  useEffect(() => {
    registry.register({
      id: "edit.undo",
      label: "Undo",
      execute: () => {
        undoManager.undo();
        onActionFeedback?.("Undo");
      },
    });

    registry.register({
      id: "edit.redo",
      label: "Redo",
      execute: () => {
        undoManager.redo();
        onActionFeedback?.("Redo");
      },
    });

    registry.register({
      id: "session.save",
      label: "Save",
      execute: () => {
        void saveNow();
      },
    });

    // Ctrl+Z / Cmd+Z for undo
    shortcuts.bind({ key: "z", ctrl: true, commandId: "edit.undo" });
    shortcuts.bind({ key: "z", meta: true, commandId: "edit.undo" });

    // Ctrl+Shift+Z / Cmd+Shift+Z for redo
    shortcuts.bind({
      key: "z",
      ctrl: true,
      shift: true,
      commandId: "edit.redo",
    });
    shortcuts.bind({
      key: "z",
      meta: true,
      shift: true,
      commandId: "edit.redo",
    });

    // Ctrl+S / Cmd+S for save
    shortcuts.bind({ key: "s", ctrl: true, commandId: "session.save" });
    shortcuts.bind({ key: "s", meta: true, commandId: "session.save" });

    return () => {
      registry.unregister("edit.undo");
      registry.unregister("edit.redo");
      registry.unregister("session.save");
      shortcuts.unbind("edit.undo");
      shortcuts.unbind("edit.redo");
      shortcuts.unbind("session.save");
    };
  }, [registry, shortcuts, undoManager, saveNow, onActionFeedback]);
}
