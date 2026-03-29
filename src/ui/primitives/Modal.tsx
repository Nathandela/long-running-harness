import { useEffect, useRef } from "react";
import styles from "./Modal.module.css";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
};

export function Modal({
  open,
  onClose,
  title,
  children,
}: ModalProps): React.JSX.Element {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog === null) return;

    if (open) {
      previousFocusRef.current = document.activeElement as HTMLElement | null;
      if (!dialog.open) {
        dialog.showModal();
      }
      dialog.setAttribute("open", "");
      dialog.focus();
    } else {
      if (dialog.open) {
        dialog.close();
      }
      dialog.removeAttribute("open");
      previousFocusRef.current?.focus();
      previousFocusRef.current = null;
    }
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog === null) return;

    const handleClose = (): void => {
      onClose();
    };

    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key !== "Tab" || !dialog.open) return;

      const focusable = dialog.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (first === undefined || last === undefined) return;

      if (e.shiftKey) {
        if (
          document.activeElement === first ||
          document.activeElement === dialog
        ) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    dialog.addEventListener("close", handleClose);
    dialog.addEventListener("keydown", handleKeyDown);
    return () => {
      dialog.removeEventListener("close", handleClose);
      dialog.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      data-testid="modal-dialog"
      tabIndex={-1}
    >
      <div className={styles.titleBar}>{title}</div>
      <div className={styles.body}>{children}</div>
    </dialog>
  );
}
