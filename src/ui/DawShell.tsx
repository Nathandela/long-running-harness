import { Toolbar } from "./Toolbar";
import { ArrangementPanel, MixerPanel, InstrumentPanel } from "./panels";

export function DawShell(): React.JSX.Element {
  return (
    <div
      data-testid="daw-shell"
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        backgroundColor: "var(--color-black)",
      }}
    >
      <Toolbar />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          overflow: "hidden",
        }}
      >
        <ArrangementPanel />
        <MixerPanel />
        <InstrumentPanel />
      </div>
    </div>
  );
}
