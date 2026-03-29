import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { useTransport } from "@audio/use-transport";
import { useDawStore } from "@state/index";
import type { TrackType } from "@state/track/types";
import { BpmInput } from "./BpmInput";
import { CursorDisplay } from "./CursorDisplay";
import { BounceDialog } from "@ui/session/BounceDialog";
import styles from "./TransportBar.module.css";

const TRACK_PRESETS: {
  label: string;
  type: TrackType;
  color: string;
  namePrefix: string;
}[] = [
  {
    label: "Audio Track",
    type: "audio",
    color: "#4A90D9",
    namePrefix: "Audio",
  },
  {
    label: "Instrument Track",
    type: "instrument",
    color: "#D94A90",
    namePrefix: "Synth",
  },
  { label: "Drum Track", type: "drum", color: "#FF6B35", namePrefix: "808" },
];

export function TransportBar(): React.JSX.Element {
  const transport = useTransport();
  const transportState = useDawStore((s) => s.transportState);
  const bpm = useDawStore((s) => s.bpm);
  const loopEnabled = useDawStore((s) => s.loopEnabled);
  const setLoop = useDawStore((s) => s.setLoop);
  const addTrack = useDawStore((s) => s.addTrack);
  const setSelectedTrackIds = useDawStore((s) => s.setSelectedTrackIds);
  const [metronomeOn, setMetronomeOn] = useState(false);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [bounceOpen, setBounceOpen] = useState(false);
  const addMenuRef = useRef<HTMLDivElement>(null);
  const addBtnRef = useRef<HTMLButtonElement>(null);
  const menuElRef = useRef<HTMLDivElement>(null);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });

  const handleLoopToggle = useCallback((): void => {
    setLoop(!loopEnabled);
  }, [loopEnabled, setLoop]);

  const handleMetronomeToggle = useCallback((): void => {
    const next = !metronomeOn;
    setMetronomeOn(next);
    transport.setMetronomeEnabled(next);
  }, [metronomeOn, transport]);

  const handleBpmChange = useCallback(
    (newBpm: number): void => {
      transport.setBpm(newBpm);
    },
    [transport],
  );

  const handleAddTrack = useCallback(
    (type: TrackType, color: string, namePrefix: string): void => {
      const existing = useDawStore
        .getState()
        .tracks.filter((t) => t.type === type);
      const maxNum = existing.reduce((max, t) => {
        if (t.name.startsWith(namePrefix + " ")) {
          const num = parseInt(t.name.slice(namePrefix.length + 1), 10);
          if (!Number.isNaN(num)) return Math.max(max, num);
        }
        return max;
      }, 0);
      const id = crypto.randomUUID();
      addTrack({
        id,
        name: `${namePrefix} ${String(maxNum + 1)}`,
        type,
        color,
        muted: false,
        solo: false,
        armed: false,
        soloIsolate: false,
        volume: 1,
        pan: 0,
        clipIds: [],
      });
      setSelectedTrackIds([id]);
      setAddMenuOpen(false);
    },
    [addTrack, setSelectedTrackIds],
  );

  // Close menu on outside click, Escape, resize, or scroll
  useEffect(() => {
    if (!addMenuOpen) return;
    const close = (): void => {
      setAddMenuOpen(false);
    };
    const handleClick = (e: MouseEvent): void => {
      if (
        addMenuRef.current &&
        !addMenuRef.current.contains(e.target as Node)
      ) {
        close();
      }
    };
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", close);
    window.addEventListener("scroll", close, true);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", close);
      window.removeEventListener("scroll", close, true);
    };
  }, [addMenuOpen]);

  // Clamp menu position to viewport after it renders
  useLayoutEffect(() => {
    if (!addMenuOpen || !menuElRef.current) return;
    const rect = menuElRef.current.getBoundingClientRect();
    const clampedLeft = Math.min(
      menuPos.left,
      window.innerWidth - rect.width - 4,
    );
    const clampedTop = Math.min(
      menuPos.top,
      window.innerHeight - rect.height - 4,
    );
    if (clampedLeft !== menuPos.left || clampedTop !== menuPos.top) {
      setMenuPos({
        top: Math.max(0, clampedTop),
        left: Math.max(0, clampedLeft),
      });
    }
  }, [addMenuOpen, menuPos.left, menuPos.top]);

  const isPlaying = transportState === "playing";
  const clock = transport.getClock();
  const tempoMap = clock?.getTempoMap() ?? null;

  return (
    <header data-testid="toolbar" className={styles["transportBar"]}>
      <span className={styles["brand"]}>BRUTALWAV</span>

      <div className={styles["addTrackWrapper"]} ref={addMenuRef}>
        <button
          ref={addBtnRef}
          type="button"
          className={styles["transportBtn"]}
          aria-label="Add Track"
          aria-haspopup="menu"
          aria-expanded={addMenuOpen}
          onClick={() => {
            if (!addMenuOpen) {
              if (!addBtnRef.current) return;
              const r = addBtnRef.current.getBoundingClientRect();
              setMenuPos({ top: r.bottom + 4, left: r.left });
            }
            setAddMenuOpen((prev) => !prev);
          }}
        >
          +
        </button>
        {addMenuOpen && (
          <div
            ref={menuElRef}
            className={styles["addTrackMenu"]}
            role="menu"
            style={{ top: menuPos.top, left: menuPos.left }}
          >
            {TRACK_PRESETS.map((preset) => (
              <button
                key={preset.type}
                type="button"
                role="menuitem"
                className={styles["addTrackMenuItem"]}
                onClick={() => {
                  handleAddTrack(preset.type, preset.color, preset.namePrefix);
                }}
              >
                <span
                  className={styles["trackColorDot"]}
                  style={{ backgroundColor: preset.color }}
                />
                {preset.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className={styles["spacer"]} />

      <div className={styles["controls"]}>
        <span className={styles["label"]}>BPM</span>
        <BpmInput value={bpm} onChange={handleBpmChange} />

        <span className={styles["label"]}>4/4</span>

        <button
          type="button"
          className={styles["transportBtn"]}
          aria-pressed={isPlaying}
          aria-label="Play"
          onClick={() => {
            transport.play();
          }}
        >
          {"\u25B6"}
        </button>

        <button
          type="button"
          className={styles["transportBtn"]}
          aria-label="Stop"
          onClick={() => {
            transport.stop();
          }}
        >
          {"\u25A0"}
        </button>

        <CursorDisplay
          transportSAB={transport.getTransportSAB()}
          tempoMap={tempoMap}
        />

        <button
          type="button"
          role="switch"
          aria-checked={loopEnabled}
          aria-label="Loop"
          className={styles["transportBtn"]}
          data-active={loopEnabled}
          onClick={handleLoopToggle}
        >
          LOOP
        </button>

        <div className={styles["metronomeToggle"]}>
          <button
            type="button"
            role="switch"
            aria-checked={metronomeOn}
            aria-label="Metronome"
            className={styles["transportBtn"]}
            data-active={metronomeOn}
            onClick={handleMetronomeToggle}
          >
            MET
          </button>
        </div>

        <button
          type="button"
          className={styles["transportBtn"]}
          aria-label="Export"
          onClick={() => {
            setBounceOpen(true);
          }}
        >
          EXP
        </button>
      </div>

      <BounceDialog
        open={bounceOpen}
        onClose={() => {
          setBounceOpen(false);
        }}
      />

      <span
        className={styles["shortcutHint"]}
        title="Keyboard Shortcuts (Shift+?)"
      >
        ?
      </span>
    </header>
  );
}
