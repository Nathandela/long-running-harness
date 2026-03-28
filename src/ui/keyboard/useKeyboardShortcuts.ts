import { useEffect } from "react";
import type { CommandRegistry } from "./command-registry";
import type { ShortcutMap } from "./shortcut-map";

const IGNORED_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT"]);

export function useKeyboardShortcuts(
  registry: CommandRegistry,
  shortcuts: ShortcutMap,
): void {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      const target = event.target;
      if (target instanceof HTMLElement) {
        if (IGNORED_TAGS.has(target.tagName)) {
          return;
        }
        if (target.getAttribute("contenteditable") !== null) {
          return;
        }
      }

      const commandId = shortcuts.resolve(event);
      if (commandId === undefined) {
        return;
      }

      const executed = registry.execute(commandId);
      if (executed) {
        event.preventDefault();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return (): void => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [registry, shortcuts]);
}
