export function Toolbar(): React.JSX.Element {
  return (
    <header
      data-testid="toolbar"
      style={{
        height: "48px",
        backgroundColor: "#111",
        borderBottom: "2px solid #333",
        display: "flex",
        alignItems: "center",
        padding: "0 16px",
        fontFamily: "JetBrains Mono, monospace",
        color: "#fff",
        fontSize: "14px",
      }}
    >
      <span style={{ fontWeight: 700 }}>BRUTALWAV</span>
    </header>
  );
}
