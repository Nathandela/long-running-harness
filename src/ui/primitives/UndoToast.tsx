import { useEffect, useRef } from "react";
import styles from "./UndoToast.module.css";

const UNDO_WINDOW = 5000;

type UndoToastState = {
  message: string;
  onUndo: () => void;
};

type UndoToastProps = {
  pending: UndoToastState | null;
  onExpired: () => void;
};

export type { UndoToastState };

export function UndoToast({
  pending,
  onExpired,
}: UndoToastProps): React.JSX.Element | null {
  const timerRef = useRef(0);

  useEffect(() => {
    if (pending === null) return;

    window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      onExpired();
    }, UNDO_WINDOW);

    return () => {
      window.clearTimeout(timerRef.current);
    };
  }, [pending, onExpired]);

  if (pending === null) return null;

  return (
    <div
      className={styles["toast"]}
      role="status"
      aria-live="polite"
      data-testid="undo-toast"
    >
      <span>{pending.message}</span>
      <button
        type="button"
        className={styles["undoBtn"]}
        onClick={() => {
          window.clearTimeout(timerRef.current);
          pending.onUndo();
        }}
        data-testid="undo-btn"
      >
        Undo
      </button>
    </div>
  );
}
