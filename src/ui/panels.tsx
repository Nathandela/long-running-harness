import { useDawStore } from "@state/store";
import { SynthEditor } from "@ui/synth";

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
  const selectedTrackIds = useDawStore((s) => s.selectedTrackIds);
  const tracks = useDawStore((s) => s.tracks);
  const selectedTrack = tracks.find((t) => selectedTrackIds.includes(t.id));

  // Show synth editor for instrument tracks
  if (selectedTrack?.type === "instrument") {
    return (
      <section
        data-testid="instrument-panel"
        style={{ height: "240px", overflow: "auto" }}
      >
        <SynthEditor trackId={selectedTrack.id} />
      </section>
    );
  }

  return (
    <section
      data-testid="instrument-panel"
      style={{ ...panelStyle, height: "240px" }}
    >
      {selectedTrack ? "AUDIO TRACK" : "INSTRUMENT"}
    </section>
  );
}
