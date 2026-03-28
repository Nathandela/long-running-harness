import type { AudioSourceHandle, WaveformPeaks } from "@audio/media-pool";
import { WaveformPreview } from "./WaveformPreview";

type MediaPoolItemProps = {
  source: AudioSourceHandle;
  peaks: WaveformPeaks | undefined;
  onRemove: (id: string) => void;
};

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m)}:${String(s).padStart(2, "0")}`;
}

const itemStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "var(--space-2)",
  padding: "var(--space-1) var(--space-2)",
  borderBottom: "1px solid var(--color-gray-700)",
  fontFamily: "var(--font-mono)",
  fontSize: "var(--text-xs)",
};

const nameStyle: React.CSSProperties = {
  flex: 1,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
  color: "var(--color-white)",
};

const metaStyle: React.CSSProperties = {
  color: "var(--color-gray-500)",
  fontSize: "var(--text-xs)",
};

const badgeStyle: React.CSSProperties = {
  padding: "0 var(--space-1)",
  border: "1px solid var(--color-gray-500)",
  color: "var(--color-gray-300)",
  fontSize: "var(--text-xs)",
  textTransform: "uppercase",
  lineHeight: "1.4",
};

const deleteStyle: React.CSSProperties = {
  background: "none",
  border: "none",
  color: "var(--color-gray-500)",
  cursor: "pointer",
  fontFamily: "var(--font-mono)",
  fontSize: "var(--text-xs)",
  padding: "var(--space-1)",
};

export function MediaPoolItem({
  source,
  peaks,
  onRemove,
}: MediaPoolItemProps): React.JSX.Element {
  return (
    <div style={itemStyle} data-testid={`media-item-${source.id}`}>
      {peaks !== undefined ? (
        <WaveformPreview peaks={peaks} width={48} height={20} />
      ) : (
        <div
          style={{
            width: 48,
            height: 20,
            backgroundColor: "var(--color-gray-700)",
          }}
        />
      )}
      <span style={nameStyle}>{source.name}</span>
      <span style={metaStyle}>{formatDuration(source.durationSeconds)}</span>
      <span style={badgeStyle}>{source.format}</span>
      <button
        type="button"
        style={deleteStyle}
        onClick={() => {
          onRemove(source.id);
        }}
        aria-label={`Remove ${source.name}`}
      >
        x
      </button>
    </div>
  );
}
