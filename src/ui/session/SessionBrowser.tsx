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
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback((): void => {
    void storage
      .listSessions()
      .then((list) => {
        setSessions(list);
        setError(null);
      })
      .catch(() => {
        setError("Failed to load sessions.");
      });
  }, [storage]);

  useEffect(() => {
    if (open) {
      refresh();
    }
  }, [open, refresh]);

  function handleDelete(id: string): void {
    void storage
      .deleteSession(id)
      .then(refresh)
      .catch(() => {
        setError("Failed to delete session.");
      });
  }

  return (
    <Modal open={open} onClose={onClose} title="Sessions">
      {error !== null ? (
        <div>
          <p style={{ color: "var(--color-error)" }}>{error}</p>
          <Button size="sm" onClick={refresh}>
            Retry
          </Button>
        </div>
      ) : sessions.length === 0 ? (
        <p>No saved sessions</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {sessions.map((s) => (
            <li
              key={s.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "var(--space-2)",
                padding: "var(--space-1) 0",
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
