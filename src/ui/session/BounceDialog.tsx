import { useCallback, useRef, useState } from "react";
import { Modal } from "@ui/primitives/Modal";
import { Button } from "@ui/primitives/Button";
import { useDawStore } from "@state/store";
import { useAutomationStore } from "@state/automation";
import { createBounceEngine } from "@audio/bounce";
import type { BounceRange, BounceProgress } from "@audio/bounce";
import styles from "./BounceDialog.module.css";

type BounceDialogProps = {
  open: boolean;
  onClose: () => void;
};

type BounceState =
  | { status: "idle" }
  | { status: "bouncing"; progress: BounceProgress }
  | { status: "done" };

export function BounceDialog({
  open,
  onClose,
}: BounceDialogProps): React.JSX.Element | null {
  const [rangeType, setRangeType] = useState<"full" | "region">("full");
  const [bounceState, setBounceState] = useState<BounceState>({
    status: "idle",
  });
  const engineRef = useRef(createBounceEngine());

  const handleBounce = useCallback(async (): Promise<void> => {
    const state = useDawStore.getState();
    const automationState = useAutomationStore.getState();

    const allLanes = Object.values(automationState.lanes).flat();

    let range: BounceRange;
    if (rangeType === "region") {
      range = {
        type: "region",
        start: state.loopStart,
        end: state.loopEnd,
      };
    } else {
      range = { type: "full" };
    }

    const engine = createBounceEngine();
    engineRef.current = engine;

    const generator = engine.bounce({
      sampleRate: 48_000,
      bitDepth: 32,
      range,
      tracks: state.tracks,
      clips: state.clips as Parameters<typeof engine.bounce>[0]["clips"],
      automationLanes: allLanes,
      masterLevel: state.masterVolume,
      getBuffer: () => undefined,
      instruments: new Map(),
    });

    try {
      let result: Awaited<ReturnType<typeof generator.next>>;
      do {
        result = await generator.next();
        if (result.done !== true) {
          setBounceState({ status: "bouncing", progress: result.value });
        }
      } while (result.done !== true);

      const bounceResult = result.value;
      setBounceState({ status: "done" });

      // Trigger browser download
      const url = URL.createObjectURL(bounceResult.blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "bounce.wav";
      a.click();
      URL.revokeObjectURL(url);

      setBounceState({ status: "idle" });
      onClose();
    } catch {
      setBounceState({ status: "idle" });
    }
  }, [rangeType, onClose]);

  const handleCancel = useCallback((): void => {
    if (bounceState.status === "bouncing") {
      engineRef.current.cancel();
    }
    setBounceState({ status: "idle" });
    onClose();
  }, [bounceState, onClose]);

  if (!open) return null;

  const isBouncing = bounceState.status === "bouncing";

  return (
    <Modal open={open} onClose={handleCancel} title="Export Audio">
      <div className={styles["form"]}>
        <div className={styles["rangeGroup"]}>
          <span className={styles["rangeLabel"]}>Range</span>
          <label className={styles["radioRow"]}>
            <input
              type="radio"
              name="bounceRange"
              value="full"
              checked={rangeType === "full"}
              onChange={() => {
                setRangeType("full");
              }}
              disabled={isBouncing}
            />
            Full Session
          </label>
          <label className={styles["radioRow"]}>
            <input
              type="radio"
              name="bounceRange"
              value="region"
              checked={rangeType === "region"}
              onChange={() => {
                setRangeType("region");
              }}
              disabled={isBouncing}
            />
            Loop Region
          </label>
        </div>

        <span className={styles["formatInfo"]}>WAV / 48kHz / 32-bit float</span>

        {isBouncing && (
          <div className={styles["progressSection"]}>
            <progress
              className={styles["progressBar"]}
              value={bounceState.progress.progress}
              max={1}
              role="progressbar"
              aria-valuenow={Math.round(bounceState.progress.progress * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
            />
            <span className={styles["progressLabel"]}>
              {bounceState.progress.phase} &mdash;{" "}
              {Math.round(bounceState.progress.progress * 100)}%
            </span>
          </div>
        )}

        <div className={styles["actions"]}>
          <Button variant="ghost" size="sm" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => void handleBounce()}
            disabled={isBouncing}
          >
            Bounce
          </Button>
        </div>
      </div>
    </Modal>
  );
}
