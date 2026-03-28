export function Toolbar(): React.JSX.Element {
  return (
    <header
      data-testid="toolbar"
      style={{
        height: "var(--space-12)",
        backgroundColor: "var(--color-gray-900)",
        borderBottom: "var(--border)",
        display: "flex",
        alignItems: "center",
        padding: "0 var(--space-4)",
        fontFamily: "var(--font-mono)",
        color: "var(--color-white)",
        fontSize: "var(--text-base)",
      }}
    >
      <span style={{ fontWeight: 700 }}>BRUTALWAV</span>
    </header>
  );
}
