type ClickToStartProps = {
  onStart: () => void;
};

export function ClickToStart({
  onStart,
}: ClickToStartProps): React.JSX.Element {
  return (
    <button
      type="button"
      onClick={onStart}
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "var(--color-black)",
        color: "var(--color-white)",
        fontFamily: "var(--font-mono)",
        cursor: "pointer",
        zIndex: 9999,
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
        <p
          style={{
            fontSize: "var(--text-base)",
            color: "var(--color-gray-300)",
          }}
        >
          Click to start audio engine
        </p>
      </div>
    </button>
  );
}
