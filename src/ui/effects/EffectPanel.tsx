/**
 * Parameter panel for a single effect instance.
 * Renders knobs for each parameter, bypass toggle, and remove button.
 */

import { useCallback } from "react";
import { RotaryKnob } from "@ui/controls/RotaryKnob";
import { tokens } from "@ui/tokens/tokens";
import type { EffectDefinition } from "@audio/effects";

type EffectPanelProps = {
  definition: EffectDefinition;
  params: Record<string, number>;
  bypassed: boolean;
  onParamChange: (key: string, value: number) => void;
  onBypassToggle: () => void;
  onRemove: () => void;
};

export function EffectPanel({
  definition,
  params,
  bypassed,
  onParamChange,
  onBypassToggle,
  onRemove,
}: EffectPanelProps): React.JSX.Element {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: tokens.space[1],
        padding: tokens.space[2],
        border: "2px solid var(--color-gray-700)",
        backgroundColor: bypassed ? tokens.color.gray900 : tokens.color.black,
        opacity: bypassed ? 0.6 : 1,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: tokens.space[2],
        }}
      >
        <span
          style={{
            fontFamily: tokens.font.mono,
            fontSize: tokens.text.sm,
            color: tokens.color.white,
            textTransform: "uppercase",
          }}
        >
          {definition.name}
        </span>
        <div style={{ display: "flex", gap: tokens.space[1] }}>
          <button
            type="button"
            aria-label="Bypass"
            aria-pressed={bypassed}
            onClick={onBypassToggle}
            style={{
              fontFamily: tokens.font.mono,
              fontSize: tokens.text.xs,
              border: "2px solid var(--color-gray-700)",
              background: bypassed ? tokens.color.amber : "transparent",
              color: bypassed ? tokens.color.black : tokens.color.gray300,
              cursor: "pointer",
              padding: "2px 4px",
            }}
          >
            BYP
          </button>
          <button
            type="button"
            aria-label="Remove effect"
            onClick={onRemove}
            style={{
              fontFamily: tokens.font.mono,
              fontSize: tokens.text.xs,
              border: "2px solid var(--color-gray-700)",
              background: "transparent",
              color: tokens.color.gray300,
              cursor: "pointer",
              padding: "2px 4px",
            }}
          >
            X
          </button>
        </div>
      </div>
      <div style={{ display: "flex", gap: tokens.space[2], flexWrap: "wrap" }}>
        {definition.parameters.map((p) => (
          <ParamKnob
            key={p.key}
            paramKey={p.key}
            label={p.name}
            min={p.min}
            max={p.max}
            step={p.step}
            value={params[p.key] ?? p.default}
            unit={p.unit}
            onChange={onParamChange}
          />
        ))}
      </div>
    </div>
  );
}

type ParamKnobProps = {
  paramKey: string;
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  unit: string;
  onChange: (key: string, value: number) => void;
};

function ParamKnob({
  paramKey,
  label,
  min,
  max,
  step,
  value,
  onChange,
}: ParamKnobProps): React.JSX.Element {
  const handleChange = useCallback(
    (v: number) => {
      onChange(paramKey, v);
    },
    [paramKey, onChange],
  );

  return (
    <RotaryKnob
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={handleChange}
      label={label}
      size={36}
    />
  );
}
