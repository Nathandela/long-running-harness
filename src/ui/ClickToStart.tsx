import { useState } from "react";
import { Spinner } from "./primitives/Spinner";
import styles from "./ClickToStart.module.css";

export const ENGINE_TIMEOUT_MS = 30_000;

type ClickToStartProps = {
  onStart: () => Promise<void>;
};

export function ClickToStart({
  onStart,
}: ClickToStartProps): React.JSX.Element {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await Promise.race([
        onStart(),
        new Promise<never>((_, reject) => {
          setTimeout(() => {
            reject(new Error("timeout"));
          }, ENGINE_TIMEOUT_MS);
        }),
      ]);
    } catch (e) {
      setLoading(false);
      const isTimeout = e instanceof Error && e.message === "timeout";
      setError(
        isTimeout
          ? "Audio engine timed out. Click to retry."
          : "Failed to start audio engine. Click to retry.",
      );
    }
  };

  return (
    <button
      type="button"
      onClick={() => {
        void handleClick();
      }}
      disabled={loading}
      className={`${styles["overlay"] ?? ""} ${styles["scanline"] ?? ""}`}
    >
      <div className={styles.content}>
        <p className={styles.title}>BRUTALWAV</p>
        {loading ? (
          <div className={styles.status}>
            <Spinner />
            <span>Starting audio engine...</span>
          </div>
        ) : error !== null ? (
          <p className={styles.error}>{error}</p>
        ) : (
          <p className={styles.hint}>Click to start audio engine</p>
        )}
      </div>
    </button>
  );
}
