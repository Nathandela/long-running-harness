import { Modal } from "@ui/primitives/Modal";
import { Button } from "@ui/primitives/Button";

type RecoveryDialogProps = {
  open: boolean;
  warnings: string[];
  onAccept: () => void;
  onDiscard: () => void;
};

export function RecoveryDialog({
  open,
  warnings,
  onAccept,
  onDiscard,
}: RecoveryDialogProps): React.JSX.Element {
  return (
    <Modal open={open} onClose={onDiscard} title="Session Recovery">
      <p>
        The saved session had issues. The following sections were reset to
        defaults:
      </p>
      <ul>
        {warnings.map((w) => (
          <li key={w}>{w}</li>
        ))}
      </ul>
      <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
        <Button variant="primary" onClick={onAccept}>
          Continue with recovered session
        </Button>
        <Button variant="secondary" onClick={onDiscard}>
          Start fresh
        </Button>
      </div>
    </Modal>
  );
}
