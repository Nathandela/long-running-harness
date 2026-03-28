const panelStyle: React.CSSProperties = {
  border: "var(--border)",
  backgroundColor: "var(--color-gray-900)",
  color: "var(--color-gray-500)",
  fontFamily: "var(--font-mono)",
  fontSize: "var(--text-sm)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "120px",
};

export function InstrumentPanel(): React.JSX.Element {
  return (
    <section
      data-testid="instrument-panel"
      style={{ ...panelStyle, height: "240px" }}
    >
      INSTRUMENT
    </section>
  );
}
