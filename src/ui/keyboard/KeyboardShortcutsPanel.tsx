import { Modal } from "@ui/primitives/Modal";
import { tokens } from "@ui/tokens/tokens";

type ShortcutEntry = {
  key: string;
  description: string;
};

const SHORTCUTS: ShortcutEntry[] = [
  { key: "Space", description: "Play / Stop" },
  { key: "Ctrl+Z", description: "Undo" },
  { key: "Ctrl+Shift+Z", description: "Redo" },
  { key: "Ctrl+S", description: "Save" },
  { key: "P", description: "Pencil tool (Piano Roll)" },
  { key: "S", description: "Select tool (Piano Roll)" },
  { key: "E", description: "Erase tool (Piano Roll)" },
  { key: "Delete", description: "Delete selected notes" },
  { key: "?", description: "Toggle this panel" },
];

type KeyboardShortcutsPanelProps = {
  open: boolean;
  onClose: () => void;
};

export function KeyboardShortcutsPanel({
  open,
  onClose,
}: KeyboardShortcutsPanelProps): React.JSX.Element {
  return (
    <Modal open={open} onClose={onClose} title="Keyboard Shortcuts">
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontFamily: tokens.font.mono,
          fontSize: tokens.text.sm,
        }}
      >
        <tbody>
          {SHORTCUTS.map((s) => (
            <tr key={s.key}>
              <td
                style={{
                  padding: `${String(tokens.space[1])}px ${String(tokens.space[2])}px`,
                  color: tokens.color.gray300,
                  whiteSpace: "nowrap",
                }}
              >
                {s.key}
              </td>
              <td
                style={{
                  padding: `${String(tokens.space[1])}px ${String(tokens.space[2])}px`,
                  color: tokens.color.white,
                }}
              >
                {s.description}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Modal>
  );
}
