type ClickToStartProps = {
  onStart: () => void;
};

export function ClickToStart({
  onStart,
}: ClickToStartProps): React.JSX.Element {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onStart}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onStart();
        }
      }}
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#000",
        color: "#fff",
        fontFamily: "JetBrains Mono, monospace",
        cursor: "pointer",
        zIndex: 9999,
      }}
    >
      <div style={{ textAlign: "center" }}>
        <p style={{ fontSize: "24px", marginBottom: "8px" }}>BRUTALWAV</p>
        <p style={{ fontSize: "14px", color: "#888" }}>
          Click to start audio engine
        </p>
      </div>
    </div>
  );
}
