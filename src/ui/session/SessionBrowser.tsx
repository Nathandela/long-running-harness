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
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

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

  const handleClose = useCallback(() => {
    setConfirmDeleteId(null);
    onClose();
  }, [onClose]);

  function handleDelete(id: string): void {
    void storage
      .deleteSession(id)
      .then(() => {
        setConfirmDeleteId(null);
        refresh();
      })
      .catch(() => {
        setConfirmDeleteId(null);
        setError("Failed to delete session.");
      });
  }

  const pendingSession = sessions.find((s) => s.id === confirmDeleteId);

  return (
    <Modal open={open} onClose={handleClose} title="Sessions">
      {confirmDeleteId !== null && pendingSession !== undefined ? (
        <div data-testid="delete-confirm">
          <p>
            Delete session &ldquo;{pendingSession.name}&rdquo;? This cannot be
            undone.
          </p>
          <div
            style={{
              display: "flex",
              gap: "var(--space-2)",
              marginTop: "var(--space-2)",
            }}
          >
            <Button
              size="sm"
              variant="primary"
              data-testid="confirm-delete"
              onClick={() => {
                handleDelete(confirmDeleteId);
              }}
            >
              Delete
            </Button>
            <Button
              size="sm"
              variant="secondary"
              data-testid="cancel-delete"
              onClick={() => {
                setConfirmDeleteId(null);
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : error !== null ? (
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
                  setConfirmDeleteId(s.id);
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
