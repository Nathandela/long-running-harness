import { useState } from "react";
import { Spinner } from "./primitives/Spinner";

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
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "var(--color-black)",
        color: "var(--color-white)",
        fontFamily: "var(--font-mono)",
        cursor: loading ? "wait" : "pointer",
        zIndex: "var(--z-overlay)",
        border: "none",
        width: "100%",
        height: "100%",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <p
          style={{
            fontSize: "var(--text-2xl)",
            marginBottom: "var(--space-2)",
          }}
        >
          BRUTALWAV
        </p>
        {loading ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "var(--space-2)",
              color: "var(--color-gray-300)",
              fontSize: "var(--text-base)",
            }}
          >
            <Spinner />
            <span>Starting audio engine...</span>
          </div>
        ) : error !== null ? (
          <p
            style={{
              fontSize: "var(--text-base)",
              color: "var(--color-error)",
            }}
          >
            {error}
          </p>
        ) : (
          <p
            style={{
              fontSize: "var(--text-base)",
              color: "var(--color-gray-300)",
            }}
          >
            Click to start audio engine
          </p>
        )}
      </div>
    </button>
  );
}
