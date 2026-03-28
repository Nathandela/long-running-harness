/**
 * TR-808 Drum Machine panel.
 * Pad grid, step sequencer rows per instrument, per-instrument knobs,
 * pattern A/B selector, accent row, current step indicator.
 */

import { tokens } from "@ui/tokens/tokens";
import { StepButton } from "@ui/controls/StepButton";
import { DrumPad } from "@ui/controls/DrumPad";
import { DRUM_INSTRUMENTS } from "@audio/drum-machine/drum-types";
import type {
  DrumInstrumentId,
  DrumInstrumentParams,
  DrumPattern,
} from "@audio/drum-machine/drum-types";

type DrumMachinePanelProps = {
  pattern: DrumPattern;
  currentStep: number;
  activePatternName: string;
  onToggleStep: (instrumentId: DrumInstrumentId, stepIndex: number) => void;
  onSetAccent: (stepIndex: number, accent: boolean) => void;
  onSetFlam: (stepIndex: number, flamMs: number) => void;
  onTriggerPad: (instrumentId: DrumInstrumentId) => void;
  onParamChange: (
    instrumentId: DrumInstrumentId,
    key: keyof DrumInstrumentParams,
    value: number,
  ) => void;
  onSwitchPattern: (name: string) => void;
  onClearPattern: () => void;
  params: Record<DrumInstrumentId, DrumInstrumentParams>;
};

const BORDER = String(tokens.border.width) + "px solid " + tokens.color.gray700;

const labelStyle: React.CSSProperties = {
  fontFamily: tokens.font.mono,
  fontSize: tokens.text.xs,
  color: tokens.color.gray300,
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  width: 64,
  textAlign: "right",
  flexShrink: 0,
};

function ParamKnob({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}): React.JSX.Element {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 1,
      }}
    >
      <span
        style={{
          fontFamily: tokens.font.mono,
          fontSize: tokens.text.xs - 1,
          color: tokens.color.gray300,
        }}
      >
        {label}
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => {
          onChange(Number(e.target.value));
        }}
        style={{ width: 48, accentColor: tokens.color.amber }}
        aria-label={label}
      />
    </div>
  );
}

function InstrumentRow({
  instrumentId,
  instrumentLabel,
  steps,
  currentStep,
  params,
  onToggle,
  onTriggerPad,
  onParamChange,
}: {
  instrumentId: DrumInstrumentId;
  instrumentLabel: string;
  steps: DrumPattern["steps"];
  currentStep: number;
  params: DrumInstrumentParams;
  onToggle: (step: number) => void;
  onTriggerPad: () => void;
  onParamChange: (key: keyof DrumInstrumentParams, value: number) => void;
}): React.JSX.Element {
  return (
    <div
      data-testid={`instrument-row-${instrumentId}`}
      style={{ display: "flex", alignItems: "center", gap: tokens.space[2] }}
    >
      <DrumPad label={instrumentLabel} onTrigger={onTriggerPad} size={32} />
      <span style={labelStyle}>{instrumentId.toUpperCase()}</span>
      <div style={{ display: "flex", gap: 2 }}>
        {steps.map((step, i) => (
          <StepButton
            key={i}
            active={step.triggers[instrumentId]}
            current={i === currentStep}
            onToggle={() => {
              onToggle(i);
            }}
            index={i}
          />
        ))}
      </div>
      <div
        style={{
          display: "flex",
          gap: tokens.space[1],
          marginLeft: tokens.space[2],
        }}
      >
        <ParamKnob
          label="Tone"
          value={params.tone}
          min={200}
          max={20000}
          step={100}
          onChange={(v) => {
            onParamChange("tone", v);
          }}
        />
        <ParamKnob
          label="Decay"
          value={params.decay}
          min={0.01}
          max={2}
          step={0.01}
          onChange={(v) => {
            onParamChange("decay", v);
          }}
        />
        <ParamKnob
          label="Tune"
          value={params.tune}
          min={0.5}
          max={2}
          step={0.01}
          onChange={(v) => {
            onParamChange("tune", v);
          }}
        />
        <ParamKnob
          label="Vol"
          value={params.volume}
          min={0}
          max={1}
          step={0.01}
          onChange={(v) => {
            onParamChange("volume", v);
          }}
        />
      </div>
    </div>
  );
}

function AccentRow({
  steps,
  currentStep,
  onSetAccent,
}: {
  steps: DrumPattern["steps"];
  currentStep: number;
  onSetAccent: (stepIndex: number, accent: boolean) => void;
}): React.JSX.Element {
  return (
    <div
      data-testid="accent-row"
      style={{ display: "flex", alignItems: "center", gap: tokens.space[2] }}
    >
      <div style={{ width: 32 }} />
      <span style={labelStyle}>ACC</span>
      <div style={{ display: "flex", gap: 2 }}>
        {steps.map((step, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Accent ${String(i + 1)}`}
            aria-pressed={step.accent}
            onClick={() => {
              onSetAccent(i, !step.accent);
            }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 24,
              height: 12,
              padding: 0,
              border: BORDER,
              borderRadius: 0,
              background: step.accent
                ? tokens.color.pink
                : tokens.color.gray900,
              cursor: "pointer",
              borderColor: i === currentStep ? tokens.color.white : undefined,
            }}
          />
        ))}
      </div>
    </div>
  );
}

export function DrumMachinePanel({
  pattern,
  currentStep,
  activePatternName,
  onToggleStep,
  onSetAccent,
  onTriggerPad,
  onParamChange,
  onSwitchPattern,
  onClearPattern,
  params,
}: DrumMachinePanelProps): React.JSX.Element {
  return (
    <div
      data-testid="drum-machine-panel"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: tokens.space[1],
        padding: tokens.space[2],
        backgroundColor: tokens.color.gray900,
        fontFamily: tokens.font.mono,
        fontSize: tokens.text.sm,
        color: tokens.color.gray100,
        overflow: "auto",
      }}
    >
      {/* Header: title + pattern buttons */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: tokens.space[2],
          borderBottom: BORDER,
          paddingBottom: tokens.space[1],
        }}
      >
        <span
          style={{
            fontFamily: tokens.font.mono,
            fontSize: tokens.text.lg,
            color: tokens.color.amber,
            fontWeight: 700,
          }}
        >
          TR-808
        </span>
        <button
          type="button"
          aria-label="Pattern A"
          onClick={() => {
            onSwitchPattern("A");
          }}
          style={{
            fontFamily: tokens.font.mono,
            fontSize: tokens.text.xs,
            padding: "2px 8px",
            border: BORDER,
            background:
              activePatternName === "A"
                ? tokens.color.amber
                : tokens.color.gray900,
            color:
              activePatternName === "A"
                ? tokens.color.black
                : tokens.color.gray300,
            cursor: "pointer",
          }}
        >
          A
        </button>
        <button
          type="button"
          aria-label="Pattern B"
          onClick={() => {
            onSwitchPattern("B");
          }}
          style={{
            fontFamily: tokens.font.mono,
            fontSize: tokens.text.xs,
            padding: "2px 8px",
            border: BORDER,
            background:
              activePatternName === "B"
                ? tokens.color.amber
                : tokens.color.gray900,
            color:
              activePatternName === "B"
                ? tokens.color.black
                : tokens.color.gray300,
            cursor: "pointer",
          }}
        >
          B
        </button>
        <button
          type="button"
          aria-label="Clear"
          onClick={onClearPattern}
          style={{
            fontFamily: tokens.font.mono,
            fontSize: tokens.text.xs,
            padding: "2px 8px",
            border: BORDER,
            background: tokens.color.gray900,
            color: tokens.color.red,
            cursor: "pointer",
          }}
        >
          CLR
        </button>
      </div>

      {/* Accent row */}
      <AccentRow
        steps={pattern.steps}
        currentStep={currentStep}
        onSetAccent={onSetAccent}
      />

      {/* Instrument rows */}
      {DRUM_INSTRUMENTS.map((inst) => (
        <InstrumentRow
          key={inst.id}
          instrumentId={inst.id}
          instrumentLabel={inst.label}
          steps={pattern.steps}
          currentStep={currentStep}
          params={params[inst.id]}
          onToggle={(step) => {
            onToggleStep(inst.id, step);
          }}
          onTriggerPad={() => {
            onTriggerPad(inst.id);
          }}
          onParamChange={(key, value) => {
            onParamChange(inst.id, key, value);
          }}
        />
      ))}
    </div>
  );
}
