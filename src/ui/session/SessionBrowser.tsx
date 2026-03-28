import { useEffect, useState, useCallback } from "react";
import { Modal } from "@ui/primitives/Modal";
import { Button } from "@ui/primitives/Button";
import type { SessionStorage, SessionListEntry } from "@state/session/index";

type SessionBrowserProps = {
  open: boolean;
  storage: SessionStorage;
  onLoad: (id: string) => void;
  onClose: () => void;
};

export function SessionBrowser({
  open,
  storage,
  onLoad,
  onClose,
}: SessionBrowserProps): React.JSX.Element {
  const [sessions, setSessions] = useState<SessionListEntry[]>([]);

  const refresh = useCallback((): void => {
    void storage.listSessions().then(setSessions);
  }, [storage]);

  useEffect(() => {
    if (open) {
      refresh();
    }
  }, [open, refresh]);

  function handleDelete(id: string): void {
    void storage.deleteSession(id).then(refresh);
  }

  return (
    <Modal open={open} onClose={onClose} title="Sessions">
      {sessions.length === 0 ? (
        <p>No saved sessions</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {sessions.map((s) => (
            <li
              key={s.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "4px 0",
              }}
            >
              <span style={{ flex: 1 }}>{s.name}</span>
              <Button
                size="sm"
                data-testid={`load-${s.id}`}
                onClick={() => {
                  onLoad(s.id);
                }}
              >
                Load
              </Button>
              <Button
                size="sm"
                variant="ghost"
                data-testid={`delete-${s.id}`}
                onClick={() => {
                  handleDelete(s.id);
                }}
              >
                Delete
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
