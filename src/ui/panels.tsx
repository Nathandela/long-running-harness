import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDawStore } from "@state/store";
import { SynthEditor } from "@ui/synth";
import { DrumMachinePanel } from "@ui/drum-machine";
import { useTrackAudioBridge } from "@audio/TrackAudioBridgeProvider";
import type { TrackAudioBridge } from "@audio/track-audio-bridge";
import { useTransport } from "@audio/use-transport";
import type {
  DrumInstrumentId,
  DrumInstrumentParams,
  DrumPattern,
} from "@audio/drum-machine/drum-types";
import {
  DRUM_INSTRUMENTS,
  DRUM_TO_PITCH,
} from "@audio/drum-machine/drum-types";
import type { MidiClipModel, MIDINoteEvent } from "@state/track/types";
import { AddClipCommand } from "@state/track/track-commands";
import { sharedUndoManager } from "@state/undo";
import {
  sequencerCache,
  paramsCache,
  getOrCreateSequencer,
  getOrCreateParams,
} from "@audio/drum-machine/sequencer-cache";
import styles from "./panels.module.css";

// Re-export for test compatibility
export { sequencerCache, paramsCache };

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
  onCommitToTimeline: () => void;
} {
  const transport = useTransport();
  const transportState = useDawStore((s) => s.transportState);
  const bpm = useDawStore((s) => s.bpm);

  const seq = getOrCreateSequencer(trackId);

  const [pattern, setPattern] = useState<DrumPattern>(() => seq.getPattern());
  const [liveStep, setLiveStep] = useState(0);
  const [params, setParams] = useState<
    Record<DrumInstrumentId, DrumInstrumentParams>
  >(() => getOrCreateParams(trackId));

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

  // Audio scheduling is handled persistently by DrumSchedulerService
  // in TrackAudioBridgeProvider (not here, so it survives track deselection).

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

  const bridge = useTrackAudioBridge();
  const onTriggerPad = useCallback(
    (instrumentId: DrumInstrumentId) => {
      const kit = bridge.getDrumKit(trackId);
      kit?.trigger(instrumentId, 0, 1);
    },
    [bridge, trackId],
  );

  const onParamChange = useCallback(
    (
      instrumentId: DrumInstrumentId,
      key: keyof DrumInstrumentParams,
      value: number,
    ) => {
      // Forward to audio engine
      const kit = bridge.getDrumKit(trackId);
      kit?.setParam(instrumentId, key, value);

      setParams((prev) => {
        const next = {
          ...prev,
          [instrumentId]: { ...prev[instrumentId], [key]: value },
        };
        paramsCache.set(trackId, next);
        return next;
      });
    },
    [bridge, trackId],
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

  const onCommitToTimeline = useCallback(() => {
    const state = useDawStore.getState();
    const currentPattern = seq.getPattern();
    const barDuration = (60 / state.bpm) * 4; // 1 bar = 4 beats
    const stepDuration = barDuration / currentPattern.steps.length;

    const noteEvents: MIDINoteEvent[] = [];
    for (let i = 0; i < currentPattern.steps.length; i++) {
      const step = currentPattern.steps[i];
      if (!step) continue;
      const velocity = step.accent ? 127 : 100;
      for (const { id: instId } of DRUM_INSTRUMENTS) {
        if (!step.triggers[instId]) continue;
        const pitch = DRUM_TO_PITCH[instId];
        noteEvents.push({
          id: "note-" + crypto.randomUUID(),
          pitch,
          velocity,
          startTime: i * stepDuration,
          duration: stepDuration * 0.8,
        });
      }
    }

    if (noteEvents.length === 0) return;

    const clip: MidiClipModel = {
      type: "midi",
      id: "clip-" + crypto.randomUUID(),
      trackId,
      startTime: state.cursorSeconds,
      duration: barDuration,
      noteEvents,
      name: "808 " + currentPattern.name,
    };

    const cmd = new AddClipCommand(clip);
    cmd.execute();
    sharedUndoManager.push(cmd);
  }, [seq, trackId]);

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
    onCommitToTimeline,
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
      onCommitToTimeline={state.onCommitToTimeline}
      params={state.params}
    />
  );
}

function SynthTrackPanel({
  trackId,
  bridge,
}: {
  trackId: string;
  bridge: TrackAudioBridge;
}): React.JSX.Element {
  const instrument = bridge.getInstrument(trackId);
  const onNoteOn = useMemo(
    () =>
      instrument
        ? (note: number, velocity: number) => {
            instrument.noteOn(note, velocity);
          }
        : undefined,
    [instrument],
  );
  const onNoteOff = useMemo(
    () =>
      instrument
        ? (note: number) => {
            instrument.noteOff(note);
          }
        : undefined,
    [instrument],
  );
  return (
    <section
      data-testid="instrument-panel"
      className={styles["instrumentPanelFull"]}
    >
      <SynthEditor
        trackId={trackId}
        onNoteOn={onNoteOn}
        onNoteOff={onNoteOff}
      />
    </section>
  );
}

export function InstrumentPanel(): React.JSX.Element {
  // Use selectedTrackIds[0] to match DawShell's selected-track logic exactly.
  // tracks.find(t => selectedTrackIds.includes(t.id)) would use track-array
  // order instead of selection order, diverging under multi-select.
  const selectedTrack = useDawStore((s) => {
    const id = s.selectedTrackIds[0];
    if (id === undefined) return undefined;
    return s.tracks.find((t) => t.id === id);
  });
  const bridge = useTrackAudioBridge();

  if (selectedTrack?.type === "instrument") {
    return <SynthTrackPanel trackId={selectedTrack.id} bridge={bridge} />;
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
