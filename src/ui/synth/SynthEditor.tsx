/**
 * Synth editor panel: oscillator type selectors, filter cutoff/resonance knobs,
 * ADSR sliders, LFO rate/depth knobs.
 * Neo-brutalist styling consistent with the design system.
 */

import { useCallback } from "react";
import { tokens } from "@ui/tokens/tokens";
import { useSynthStore } from "@state/synth";
import { VirtualKeyboard } from "./VirtualKeyboard";
import type { SynthParameterMap } from "@audio/synth/synth-types";
import {
  WAVEFORM_TYPES,
  FILTER_TYPES,
  LFO_SHAPES,
} from "@audio/synth/synth-types";

type SynthEditorProps = {
  trackId: string;
  onNoteOn?: (note: number, velocity: number) => void;
  onNoteOff?: (note: number) => void;
};

// ─── Shared Styles ───

const BORDER = String(tokens.border.width) + "px solid " + tokens.color.gray700;

const sectionStyle: React.CSSProperties = {
  border: BORDER,
  padding: tokens.space[2],
  display: "flex",
  flexDirection: "column",
  gap: tokens.space[1],
};

const labelStyle: React.CSSProperties = {
  fontFamily: tokens.font.mono,
  fontSize: tokens.text.xs,
  color: tokens.color.gray300,
  textTransform: "uppercase",
  letterSpacing: "0.1em",
};

const controlRowStyle: React.CSSProperties = {
  display: "flex",
  gap: tokens.space[2],
  alignItems: "center",
};

// ─── Reusable Controls ───

function Knob({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (v: number) => void;
}): React.JSX.Element {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 2,
      }}
    >
      <span style={labelStyle}>{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => {
          onChange(Number(e.target.value));
        }}
        style={{ width: 60, accentColor: tokens.color.blue }}
        data-testid={"knob-" + label.toLowerCase().replace(/\s/g, "-")}
      />
      <span style={{ ...labelStyle, fontSize: tokens.text.xs - 1 }}>
        {value.toFixed(step < 1 ? 2 : 0)}
        {unit ?? ""}
      </span>
    </div>
  );
}

function TypeSelector<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly T[];
  onChange: (v: T) => void;
}): React.JSX.Element {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <span style={labelStyle}>{label}</span>
      <select
        value={value}
        onChange={(e) => {
          onChange(e.target.value as T);
        }}
        data-testid={"select-" + label.toLowerCase().replace(/\s/g, "-")}
        style={{
          backgroundColor: tokens.color.gray900,
          color: tokens.color.gray100,
          border: BORDER,
          fontFamily: tokens.font.mono,
          fontSize: tokens.text.xs,
          padding: "2px 4px",
        }}
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}

// ─── Main Editor ───

export function SynthEditor({
  trackId,
  onNoteOn,
  onNoteOff,
}: SynthEditorProps): React.JSX.Element {
  const params = useSynthStore((s) => s.synths[trackId]?.params);
  const legato = useSynthStore((s) => s.synths[trackId]?.legato ?? false);
  const setParam = useSynthStore((s) => s.setParam);
  const setLegato = useSynthStore((s) => s.setLegato);

  const p = params ?? useSynthStore.getState().getParams(trackId);

  const set = useCallback(
    <K extends keyof SynthParameterMap>(
      key: K,
      value: SynthParameterMap[K],
    ) => {
      setParam(trackId, key, value);
    },
    [trackId, setParam],
  );

  const handleNoteOn = useCallback(
    (note: number, velocity: number) => {
      onNoteOn?.(note, velocity);
    },
    [onNoteOn],
  );

  const handleNoteOff = useCallback(
    (note: number) => {
      onNoteOff?.(note);
    },
    [onNoteOff],
  );

  return (
    <div
      data-testid="synth-editor"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: tokens.space[2],
        padding: tokens.space[2],
        backgroundColor: tokens.color.gray900,
        fontFamily: tokens.font.mono,
        fontSize: tokens.text.sm,
        color: tokens.color.gray100,
        overflow: "auto",
      }}
    >
      {/* Oscillators Row */}
      <div style={{ display: "flex", gap: tokens.space[2] }}>
        {/* OSC 1 */}
        <section style={sectionStyle} data-testid="osc1-section">
          <span style={{ ...labelStyle, color: tokens.color.blue }}>OSC 1</span>
          <div style={controlRowStyle}>
            <TypeSelector
              label="Type"
              value={p.osc1Type}
              options={WAVEFORM_TYPES}
              onChange={(v) => {
                set("osc1Type", v);
              }}
            />
            <Knob
              label="Oct"
              value={p.osc1Octave}
              min={-2}
              max={2}
              step={1}
              onChange={(v) => {
                set("osc1Octave", v);
              }}
            />
            <Knob
              label="Detune"
              value={p.osc1Detune}
              min={-100}
              max={100}
              step={1}
              unit="c"
              onChange={(v) => {
                set("osc1Detune", v);
              }}
            />
            <Knob
              label="Level"
              value={p.osc1Level}
              min={0}
              max={1}
              step={0.01}
              onChange={(v) => {
                set("osc1Level", v);
              }}
            />
          </div>
        </section>

        {/* OSC 2 */}
        <section style={sectionStyle} data-testid="osc2-section">
          <span style={{ ...labelStyle, color: tokens.color.pink }}>OSC 2</span>
          <div style={controlRowStyle}>
            <TypeSelector
              label="Type"
              value={p.osc2Type}
              options={WAVEFORM_TYPES}
              onChange={(v) => {
                set("osc2Type", v);
              }}
            />
            <Knob
              label="Oct"
              value={p.osc2Octave}
              min={-2}
              max={2}
              step={1}
              onChange={(v) => {
                set("osc2Octave", v);
              }}
            />
            <Knob
              label="Detune"
              value={p.osc2Detune}
              min={-100}
              max={100}
              step={1}
              unit="c"
              onChange={(v) => {
                set("osc2Detune", v);
              }}
            />
            <Knob
              label="Level"
              value={p.osc2Level}
              min={0}
              max={1}
              step={0.01}
              onChange={(v) => {
                set("osc2Level", v);
              }}
            />
          </div>
        </section>
      </div>

      {/* Filter + Envelopes Row */}
      <div style={{ display: "flex", gap: tokens.space[2] }}>
        {/* Filter */}
        <section style={sectionStyle} data-testid="filter-section">
          <span style={{ ...labelStyle, color: tokens.color.green }}>
            FILTER
          </span>
          <div style={controlRowStyle}>
            <TypeSelector
              label="Type"
              value={p.filterType}
              options={FILTER_TYPES}
              onChange={(v) => {
                set("filterType", v);
              }}
            />
            <Knob
              label="Cutoff"
              value={p.filterCutoff}
              min={20}
              max={20000}
              step={1}
              unit="Hz"
              onChange={(v) => {
                set("filterCutoff", v);
              }}
            />
            <Knob
              label="Reso"
              value={p.filterResonance}
              min={0.5}
              max={20}
              step={0.1}
              onChange={(v) => {
                set("filterResonance", v);
              }}
            />
            <Knob
              label="Env"
              value={p.filterEnvDepth}
              min={-60}
              max={60}
              step={1}
              unit="st"
              onChange={(v) => {
                set("filterEnvDepth", v);
              }}
            />
          </div>
        </section>

        {/* Amp Envelope */}
        <section style={sectionStyle} data-testid="amp-env-section">
          <span style={{ ...labelStyle, color: tokens.color.amber }}>
            AMP ENV
          </span>
          <div style={controlRowStyle}>
            <Knob
              label="A"
              value={p.ampAttack}
              min={0}
              max={5}
              step={0.01}
              unit="s"
              onChange={(v) => {
                set("ampAttack", v);
              }}
            />
            <Knob
              label="D"
              value={p.ampDecay}
              min={0}
              max={5}
              step={0.01}
              unit="s"
              onChange={(v) => {
                set("ampDecay", v);
              }}
            />
            <Knob
              label="S"
              value={p.ampSustain}
              min={0}
              max={1}
              step={0.01}
              onChange={(v) => {
                set("ampSustain", v);
              }}
            />
            <Knob
              label="R"
              value={p.ampRelease}
              min={0}
              max={10}
              step={0.01}
              unit="s"
              onChange={(v) => {
                set("ampRelease", v);
              }}
            />
          </div>
        </section>

        {/* Filter Envelope */}
        <section style={sectionStyle} data-testid="filter-env-section">
          <span style={{ ...labelStyle, color: tokens.color.green }}>
            FLT ENV
          </span>
          <div style={controlRowStyle}>
            <Knob
              label="A"
              value={p.filterAttack}
              min={0}
              max={5}
              step={0.01}
              unit="s"
              onChange={(v) => {
                set("filterAttack", v);
              }}
            />
            <Knob
              label="D"
              value={p.filterDecay}
              min={0}
              max={5}
              step={0.01}
              unit="s"
              onChange={(v) => {
                set("filterDecay", v);
              }}
            />
            <Knob
              label="S"
              value={p.filterSustain}
              min={0}
              max={1}
              step={0.01}
              onChange={(v) => {
                set("filterSustain", v);
              }}
            />
            <Knob
              label="R"
              value={p.filterRelease}
              min={0}
              max={10}
              step={0.01}
              unit="s"
              onChange={(v) => {
                set("filterRelease", v);
              }}
            />
          </div>
        </section>
      </div>

      {/* LFOs + Master Row */}
      <div style={{ display: "flex", gap: tokens.space[2] }}>
        {/* LFO 1 */}
        <section style={sectionStyle} data-testid="lfo1-section">
          <span style={labelStyle}>LFO 1</span>
          <div style={controlRowStyle}>
            <TypeSelector
              label="Shape"
              value={p.lfo1Shape}
              options={LFO_SHAPES}
              onChange={(v) => {
                set("lfo1Shape", v);
              }}
            />
            <Knob
              label="Rate"
              value={p.lfo1Rate}
              min={0.1}
              max={20}
              step={0.1}
              unit="Hz"
              onChange={(v) => {
                set("lfo1Rate", v);
              }}
            />
            <Knob
              label="Depth"
              value={p.lfo1Depth}
              min={0}
              max={1}
              step={0.01}
              onChange={(v) => {
                set("lfo1Depth", v);
              }}
            />
          </div>
        </section>

        {/* LFO 2 */}
        <section style={sectionStyle} data-testid="lfo2-section">
          <span style={labelStyle}>LFO 2</span>
          <div style={controlRowStyle}>
            <TypeSelector
              label="Shape"
              value={p.lfo2Shape}
              options={LFO_SHAPES}
              onChange={(v) => {
                set("lfo2Shape", v);
              }}
            />
            <Knob
              label="Rate"
              value={p.lfo2Rate}
              min={0.1}
              max={20}
              step={0.1}
              unit="Hz"
              onChange={(v) => {
                set("lfo2Rate", v);
              }}
            />
            <Knob
              label="Depth"
              value={p.lfo2Depth}
              min={0}
              max={1}
              step={0.01}
              onChange={(v) => {
                set("lfo2Depth", v);
              }}
            />
          </div>
        </section>

        {/* Master */}
        <section style={sectionStyle} data-testid="master-section">
          <span style={labelStyle}>MASTER</span>
          <div style={controlRowStyle}>
            <Knob
              label="Gain"
              value={p.masterGain}
              min={0}
              max={1}
              step={0.01}
              onChange={(v) => {
                set("masterGain", v);
              }}
            />
            <Knob
              label="Glide"
              value={p.glideTime}
              min={0}
              max={1}
              step={0.01}
              unit="s"
              onChange={(v) => {
                set("glideTime", v);
              }}
            />
            <label
              style={{
                ...labelStyle,
                display: "flex",
                gap: 4,
                alignItems: "center",
              }}
            >
              <input
                type="checkbox"
                checked={legato}
                onChange={(e) => {
                  setLegato(trackId, e.target.checked);
                }}
                data-testid="legato-toggle"
              />
              Legato
            </label>
          </div>
        </section>
      </div>

      {/* Virtual Keyboard */}
      <VirtualKeyboard onNoteOn={handleNoteOn} onNoteOff={handleNoteOff} />
    </div>
  );
}
