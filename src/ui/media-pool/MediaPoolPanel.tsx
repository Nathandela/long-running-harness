import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  MediaPool,
  WaveformPeaks,
  MediaPoolError,
} from "@audio/media-pool";
import { MediaPoolItem } from "./MediaPoolItem";
import { useFileDrop } from "./useFileDrop";

type MediaPoolPanelProps = {
  pool: MediaPool;
};

const panelStyle: React.CSSProperties = {
  border: "var(--border)",
  backgroundColor: "var(--color-gray-900)",
  display: "flex",
  flexDirection: "column",
  height: "200px",
  overflow: "hidden",
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "var(--space-1) var(--space-2)",
  borderBottom: "1px solid var(--color-gray-700)",
  fontFamily: "var(--font-mono)",
  fontSize: "var(--text-sm)",
  color: "var(--color-gray-500)",
  flexShrink: 0,
};

const importBtnStyle: React.CSSProperties = {
  background: "none",
  border: "1px solid var(--color-gray-500)",
  color: "var(--color-gray-300)",
  fontFamily: "var(--font-mono)",
  fontSize: "var(--text-xs)",
  padding: "var(--space-1) var(--space-2)",
  cursor: "pointer",
};

const listStyle: React.CSSProperties = {
  flex: 1,
  overflowY: "auto",
};

const emptyStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flex: 1,
  color: "var(--color-gray-500)",
  fontFamily: "var(--font-mono)",
  fontSize: "var(--text-sm)",
};

const errorStyle: React.CSSProperties = {
  padding: "var(--space-1) var(--space-2)",
  backgroundColor: "var(--color-red)",
  color: "var(--color-white)",
  fontFamily: "var(--font-mono)",
  fontSize: "var(--text-xs)",
  flexShrink: 0,
};

function formatError(error: MediaPoolError): string {
  switch (error.kind) {
    case "decode-failed":
      return `Failed to decode "${error.fileName}". Try WAV, MP3, OGG, or FLAC format.`;
    case "unsupported-format":
      return `Unsupported format: "${error.fileName}". Try WAV, MP3, OGG, or FLAC.`;
    case "file-too-large":
      return `File "${error.fileName}" is too large (max 500MB).`;
    case "storage-full":
      return `Storage full. Cannot import "${error.fileName}".`;
  }
}

export function MediaPoolPanel({
  pool,
}: MediaPoolPanelProps): React.JSX.Element {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [version, setVersion] = useState(0);
  const sources = useMemo(() => pool.listSources(), [pool, version]); // eslint-disable-line react-hooks/exhaustive-deps
  const [peaksMap, setPeaksMap] = useState(new Map<string, WaveformPeaks>());
  const [error, setError] = useState<MediaPoolError | null>(null);

  useEffect(() => {
    // Load cached peaks for persisted sources
    void Promise.all(
      sources.map(async (source) => {
        if (peaksMap.has(source.id)) return;
        const peaks = await pool.getPeaks(source.id, 256);
        if (peaks !== undefined) {
          setPeaksMap((prev) => {
            const next = new Map(prev);
            next.set(source.id, peaks);
            return next;
          });
        }
      }),
    );
  }, [sources, pool]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleImport = useCallback(
    async (files: File[]) => {
      setError(null);
      for (const file of files) {
        const result = await pool.importFile(file);
        if (result.ok) {
          const peaks = await pool.getPeaks(result.handle.id, 256);
          if (peaks !== undefined) {
            setPeaksMap((prev) => {
              const next = new Map(prev);
              next.set(result.handle.id, peaks);
              return next;
            });
          }
        } else {
          setError(result.error);
        }
      }
      setVersion((v) => v + 1);
    },
    [pool],
  );

  const handleRemove = useCallback(
    (id: string) => {
      void pool.removeSource(id).then(() => {
        setVersion((v) => v + 1);
        setPeaksMap((prev) => {
          const next = new Map(prev);
          next.delete(id);
          return next;
        });
      });
    },
    [pool],
  );

  const onFileDrop = useCallback(
    (files: File[]) => {
      void handleImport(files);
    },
    [handleImport],
  );

  const { isDragging, handlers } = useFileDrop(onFileDrop);

  const onImportClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const onFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files !== null && files.length > 0) {
        void handleImport([...files]);
      }
    },
    [handleImport],
  );

  return (
    <section
      data-testid="media-pool-panel"
      style={{
        ...panelStyle,
        ...(isDragging ? { borderColor: "var(--color-blue)" } : {}),
      }}
      {...handlers}
    >
      <div style={headerStyle}>
        <span>MEDIA POOL</span>
        <button type="button" style={importBtnStyle} onClick={onImportClick}>
          IMPORT
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/wav,audio/mpeg,audio/ogg,audio/flac,.wav,.mp3,.ogg,.flac"
          multiple
          style={{ display: "none" }}
          onChange={onFileChange}
        />
      </div>

      {error !== null && <div style={errorStyle}>{formatError(error)}</div>}

      {sources.length === 0 ? (
        <div style={emptyStyle}>Drop audio files here or click IMPORT</div>
      ) : (
        <div style={listStyle}>
          {sources.map((source) => (
            <MediaPoolItem
              key={source.id}
              source={source}
              peaks={peaksMap.get(source.id)}
              onRemove={handleRemove}
            />
          ))}
        </div>
      )}
    </section>
  );
}
