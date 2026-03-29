import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  MediaPool,
  WaveformPeaks,
  MediaPoolError,
} from "@audio/media-pool";
import { MediaPoolItem } from "./MediaPoolItem";
import { useFileDrop } from "./useFileDrop";
import { Spinner } from "@ui/primitives/Spinner";
import { UndoToast, type UndoToastState } from "@ui/primitives/UndoToast";
import styles from "./MediaPoolPanel.module.css";

type MediaPoolPanelProps = {
  pool: MediaPool;
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
  const [errors, setErrors] = useState<MediaPoolError[]>([]);
  const [removeError, setRemoveError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [undoPending, setUndoPending] = useState<UndoToastState | null>(null);
  const [pendingRemoveId, setPendingRemoveId] = useState<string | null>(null);
  const importingRef = useRef(false);
  const autoDismissTimerRef = useRef(0);

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
      if (importingRef.current) return;
      importingRef.current = true;
      setIsImporting(true);
      setErrors([]);
      window.clearTimeout(autoDismissTimerRef.current);
      try {
        const importErrors: MediaPoolError[] = [];
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
            importErrors.push(result.error);
          }
        }
        if (importErrors.length > 0) {
          setErrors(importErrors);
          autoDismissTimerRef.current = window.setTimeout(() => {
            setErrors([]);
          }, 5000);
        }
        setVersion((v) => v + 1);
      } finally {
        importingRef.current = false;
        setIsImporting(false);
      }
    },
    [pool],
  );

  const executeRemove = useCallback(
    (id: string) => {
      void pool
        .removeSource(id)
        .then(() => {
          setVersion((v) => v + 1);
          setPeaksMap((prev) => {
            const next = new Map(prev);
            next.delete(id);
            return next;
          });
        })
        .catch(() => {
          const name = pool.getSource(id)?.name ?? id;
          setRemoveError(`Failed to remove "${name}".`);
        });
    },
    [pool],
  );

  const handleRemove = useCallback(
    (id: string) => {
      const name = pool.getSource(id)?.name ?? id;
      setPendingRemoveId(id);
      setUndoPending({
        message: `Removed "${name}".`,
        onUndo: () => {
          setPendingRemoveId(null);
          setUndoPending(null);
        },
      });
    },
    [pool],
  );

  const handleUndoExpired = useCallback(() => {
    setPendingRemoveId((prev) => {
      if (prev !== null) {
        executeRemove(prev);
      }
      return null;
    });
    setUndoPending(null);
  }, [executeRemove]);

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

  const panelClass = isDragging
    ? [styles["panel"], styles["dragging"]].join(" ")
    : (styles["panel"] ?? "");

  return (
    <section
      data-testid="media-pool-panel"
      className={panelClass}
      {...handlers}
    >
      <div className={styles["header"]}>
        <span>MEDIA POOL</span>
        <button
          type="button"
          className={styles["importBtn"]}
          onClick={onImportClick}
          disabled={isImporting}
        >
          {isImporting ? "IMPORTING..." : "IMPORT"}
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

      {(errors.length > 0 || removeError !== null) && (
        <div className={styles["error"]}>
          {errors.map((err, i) => (
            <div key={i}>{formatError(err)}</div>
          ))}
          {removeError !== null && <div>{removeError}</div>}
          <button
            type="button"
            className={styles["dismissBtn"]}
            onClick={() => {
              window.clearTimeout(autoDismissTimerRef.current);
              setErrors([]);
              setRemoveError(null);
            }}
            aria-label="Dismiss errors"
          >
            Dismiss
          </button>
        </div>
      )}

      {isImporting && (
        <div className={styles["importing"]}>
          <Spinner />
          <span>Importing audio...</span>
        </div>
      )}

      {sources.length === 0 ? (
        <div className={styles["empty"]}>
          Drop audio files here or click IMPORT
        </div>
      ) : (
        <div className={styles["list"]}>
          {sources
            .filter((s) => s.id !== pendingRemoveId)
            .map((source) => (
              <MediaPoolItem
                key={source.id}
                source={source}
                peaks={peaksMap.get(source.id)}
                onRemove={handleRemove}
              />
            ))}
        </div>
      )}
      <UndoToast pending={undoPending} onExpired={handleUndoExpired} />
    </section>
  );
}
