import { useState } from "react";
import { Spinner } from "./primitives/Spinner";

type ClickToStartProps = {
  onStart: () => void;
};

export function ClickToStart({
  onStart,
}: ClickToStartProps): React.JSX.Element {
  const [loading, setLoading] = useState(false);

  const handleClick = (): void => {
    setLoading(true);
    onStart();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
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
