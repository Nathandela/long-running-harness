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

export function ArrangementPanel(): React.JSX.Element {
  return (
    <section data-testid="arrangement-panel" style={{ ...panelStyle, flex: 1 }}>
      ARRANGEMENT
    </section>
  );
}

export function MixerPanel(): React.JSX.Element {
  return (
    <section
      data-testid="mixer-panel"
      style={{ ...panelStyle, height: "200px" }}
    >
      MIXER
    </section>
  );
}

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
