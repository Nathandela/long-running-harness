import { useCallback, useEffect, useRef, useState } from "react";

type BpmInputProps = {
  value: number;
  onChange: (bpm: number) => void;
};

const BPM_MIN = 20;
const BPM_MAX = 999;

export function BpmInput({
  value,
  onChange,
}: BpmInputProps): React.JSX.Element {
  const [localValue, setLocalValue] = useState(String(value));
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync external value changes
  useEffect(() => {
    setLocalValue(String(value));
  }, [value]);

  const commit = useCallback((): void => {
    const parsed = Number(localValue);
    if (!Number.isFinite(parsed) || localValue.trim() === "") {
      setLocalValue(String(value));
      return;
    }
    const clamped = Math.min(BPM_MAX, Math.max(BPM_MIN, Math.round(parsed)));
    setLocalValue(String(clamped));
    onChange(clamped);
  }, [localValue, value, onChange]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>): void => {
      if (e.key === "Enter") {
        commit();
        inputRef.current?.blur();
      } else if (e.key === "Escape") {
        setLocalValue(String(value));
        inputRef.current?.blur();
      }
    },
    [commit, value],
  );

  return (
    <input
      ref={inputRef}
      type="number"
      aria-label="BPM"
      value={localValue}
      min={BPM_MIN}
      max={BPM_MAX}
      onChange={(e) => {
        setLocalValue(e.target.value);
      }}
      onBlur={commit}
      onKeyDown={handleKeyDown}
      style={{
        width: "56px",
        backgroundColor: "var(--color-black)",
        color: "var(--color-white)",
        border: "var(--border)",
        fontFamily: "var(--font-mono)",
        fontSize: "var(--text-sm)",
        padding: "var(--space-1) var(--space-2)",
        textAlign: "center",
      }}
    />
  );
}
