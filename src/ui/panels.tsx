const panelStyle: React.CSSProperties = {
  border: "2px solid #333",
  backgroundColor: "#0a0a0a",
  color: "#666",
  fontFamily: "JetBrains Mono, monospace",
  fontSize: "12px",
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
