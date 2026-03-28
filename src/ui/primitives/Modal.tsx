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

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog === null) return;

    if (open) {
      dialog.showModal();
      dialog.setAttribute("open", "");
    } else {
      dialog.close();
      dialog.removeAttribute("open");
    }
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog === null) return;

    const handleClose = (): void => {
      onClose();
    };

    dialog.addEventListener("close", handleClose);
    return () => {
      dialog.removeEventListener("close", handleClose);
    };
  }, [onClose]);

  return (
    <dialog ref={dialogRef} className={styles.dialog} data-testid="modal-dialog">
      <div className={styles.titleBar}>{title}</div>
      <div className={styles.body}>{children}</div>
    </dialog>
  );
}
