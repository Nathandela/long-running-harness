import { useCallback, useEffect, useRef, useState } from "react";
import { useDawStore } from "@state/store";
import { SynthEditor } from "@ui/synth";
import { DrumMachinePanel } from "@ui/drum-machine";
import {
  createStepSequencer,
  type StepSequencer,
} from "@audio/drum-machine/step-sequencer";
import { useTransport } from "@audio/use-transport";
import {
  DRUM_INSTRUMENTS,
  DEFAULT_INSTRUMENT_PARAMS,
  type DrumInstrumentId,
  type DrumInstrumentParams,
  type DrumPattern,
} from "@audio/drum-machine/drum-types";
import styles from "./panels.module.css";

// Module-level cache: preserves sequencer state across unmount/remount cycles
const sequencerCache = new Map<string, StepSequencer>();

function getOrCreateSequencer(trackId: string): StepSequencer {
  let seq = sequencerCache.get(trackId);
  if (!seq) {
    seq = createStepSequencer(() => {
      // Trigger callback - audio playback handled separately
    });
    sequencerCache.set(trackId, seq);
  }
  return seq;
}

function useDrumMachineState(trackId: string): {
  pattern: DrumPattern;
  currentStep: number;
  params: Record<DrumInstrumentId, DrumInstrumentParams>;
  onToggleStep: (instrumentId: DrumInstrumentId, stepIndex: number) => void;
  onSetAccent: (stepIndex: number, accent: boolean) => void;
  onTriggerPad: (instrumentId: DrumInstrumentId) => void;
  onParamChange: (
    instrumentId: DrumInstrumentId,
    key: keyof DrumInstrumentParams,
    value: number,
  ) => void;
  onSwitchPattern: (name: string) => void;
  onClearPattern: () => void;
} {
  const transport = useTransport();
  const transportState = useDawStore((s) => s.transportState);
  const bpm = useDawStore((s) => s.bpm);

  const seq = getOrCreateSequencer(trackId);

  const [pattern, setPattern] = useState<DrumPattern>(() => seq.getPattern());
  const [liveStep, setLiveStep] = useState(0);
  const [params, setParams] = useState<
    Record<DrumInstrumentId, DrumInstrumentParams>
  >(() => {
    const initial = {} as Record<DrumInstrumentId, DrumInstrumentParams>;
    for (const inst of DRUM_INSTRUMENTS) {
      initial[inst.id] = { ...DEFAULT_INSTRUMENT_PARAMS[inst.id] };
    }
    return initial;
  });

  // Sync pattern when trackId changes (sequencer instance changes)
  useEffect(() => {
    setPattern(seq.getPattern());
  }, [seq]);

  // Transport sync: advance step indicator when playing
  const rafRef = useRef(0);
  useEffect(() => {
    if (transportState !== "playing") return;

    const clock = transport.getClock();
    if (!clock) return;

    const stepsPerBeat = 4; // 16th notes
    let lastStep = -1;

    const tick = (): void => {
      const cursor = clock.getCursorSeconds();
      const stepDuration = 60 / (bpm * stepsPerBeat);
      const step = Math.floor(cursor / stepDuration) % pattern.steps.length;
      if (step !== lastStep) {
        lastStep = step;
        setLiveStep(step);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [transportState, transport, bpm, pattern.steps.length]);

  // Derive currentStep: 0 when stopped, liveStep when playing/paused
  const currentStep = transportState === "stopped" ? 0 : liveStep;

  const onToggleStep = useCallback(
    (instrumentId: DrumInstrumentId, stepIndex: number) => {
      seq.toggleStep(instrumentId, stepIndex);
      setPattern(seq.getPattern());
    },
    [seq],
  );

  const onSetAccent = useCallback(
    (stepIndex: number, accent: boolean) => {
      seq.setAccent(stepIndex, accent);
      setPattern(seq.getPattern());
    },
    [seq],
  );

  // TODO: wire to audio engine for pad preview
  const onTriggerPad = useCallback((_instrumentId: DrumInstrumentId) => {}, []);

  // TODO: propagate param changes to audio engine
  const onParamChange = useCallback(
    (
      instrumentId: DrumInstrumentId,
      key: keyof DrumInstrumentParams,
      value: number,
    ) => {
      setParams((prev) => ({
        ...prev,
        [instrumentId]: { ...prev[instrumentId], [key]: value },
      }));
    },
    [],
  );

  const onSwitchPattern = useCallback(
    (name: string) => {
      seq.switchPattern(name);
      setPattern(seq.getPattern());
    },
    [seq],
  );

  const onClearPattern = useCallback(() => {
    seq.clearPattern();
    setPattern(seq.getPattern());
  }, [seq]);

  return {
    pattern,
    currentStep,
    params,
    onToggleStep,
    onSetAccent,
    onTriggerPad,
    onParamChange,
    onSwitchPattern,
    onClearPattern,
  };
}

function DrumMachineController({
  trackId,
}: {
  trackId: string;
}): React.JSX.Element {
  const state = useDrumMachineState(trackId);
  return (
    <DrumMachinePanel
      pattern={state.pattern}
      currentStep={state.currentStep}
      activePatternName={state.pattern.name}
      onToggleStep={state.onToggleStep}
      onSetAccent={state.onSetAccent}
      onTriggerPad={state.onTriggerPad}
      onParamChange={state.onParamChange}
      onSwitchPattern={state.onSwitchPattern}
      onClearPattern={state.onClearPattern}
      params={state.params}
    />
  );
}

export function InstrumentPanel(): React.JSX.Element {
  const selectedTrackIds = useDawStore((s) => s.selectedTrackIds);
  const tracks = useDawStore((s) => s.tracks);
  const selectedTrack = tracks.find((t) => selectedTrackIds.includes(t.id));

  if (selectedTrack?.type === "instrument") {
    return (
      <section
        data-testid="instrument-panel"
        className={styles["instrumentPanelFull"]}
      >
        <SynthEditor trackId={selectedTrack.id} />
      </section>
    );
  }

  if (selectedTrack?.type === "drum") {
    return (
      <section
        data-testid="instrument-panel"
        className={styles["instrumentPanelFull"]}
      >
        <DrumMachineController
          key={selectedTrack.id}
          trackId={selectedTrack.id}
        />
      </section>
    );
  }

  return (
    <section
      data-testid="instrument-panel"
      className={styles["instrumentPanel"]}
    >
      {selectedTrack ? "AUDIO TRACK" : "Select a track"}
    </section>
  );
}
