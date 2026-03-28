/**
 * Effects rack for a single track.
 * Shows insert chain with add/remove/bypass controls.
 */

import { useState, useCallback } from "react";
import { useEffectsStore } from "@state/effects";
import { useEffectsBridgeContext } from "@audio/effects/EffectsBridgeProvider";
import { tokens } from "@ui/tokens/tokens";
import { EffectPanel } from "./EffectPanel";

const EMPTY_SLOTS: readonly never[] = [];

type EffectsRackProps = {
  trackId: string;
};

export function EffectsRack({ trackId }: EffectsRackProps): React.JSX.Element {
  const { registry } = useEffectsBridgeContext();
  const availableEffects = registry.getAll();

  const slots = useEffectsStore((s) => s.trackEffects[trackId] ?? EMPTY_SLOTS);
  const addEffect = useEffectsStore((s) => s.addEffect);
  const removeEffect = useEffectsStore((s) => s.removeEffect);
  const updateEffectParam = useEffectsStore((s) => s.updateEffectParam);
  const toggleBypass = useEffectsStore((s) => s.toggleBypass);

  const [showSelector, setShowSelector] = useState(false);

  const handleAdd = useCallback(
    (typeId: string) => {
      const factory = registry.get(typeId);
      if (!factory) return;

      const id = `${typeId}-${crypto.randomUUID().slice(0, 8)}`;
      const params: Record<string, number> = {};
      for (const p of factory.definition.parameters) {
        params[p.key] = p.default;
      }

      addEffect(trackId, { id, typeId, bypassed: false, params });
      setShowSelector(false);
    },
    [trackId, addEffect, registry],
  );

  return (
    <div
      data-testid="effects-rack"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: tokens.space[1],
        padding: tokens.space[2],
        borderTop: "2px solid var(--color-gray-700)",
        backgroundColor: tokens.color.gray900,
        minHeight: 40,
      }}
    >
      {slots.map((slot) => {
        const factory = registry.get(slot.typeId);
        if (!factory) return null;

        return (
          <EffectPanel
            key={slot.id}
            definition={factory.definition}
            params={slot.params}
            bypassed={slot.bypassed}
            onParamChange={(key, value) => {
              updateEffectParam(trackId, slot.id, key, value);
            }}
            onBypassToggle={() => {
              toggleBypass(trackId, slot.id);
            }}
            onRemove={() => {
              removeEffect(trackId, slot.id);
            }}
          />
        );
      })}

      {showSelector ? (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: tokens.space[1],
          }}
        >
          {availableEffects.map((f) => (
            <button
              key={f.definition.id}
              type="button"
              onClick={() => {
                handleAdd(f.definition.id);
              }}
              style={{
                fontFamily: tokens.font.mono,
                fontSize: tokens.text.xs,
                border: "2px solid var(--color-gray-700)",
                background: "transparent",
                color: tokens.color.white,
                cursor: "pointer",
                padding: "4px 8px",
              }}
            >
              {f.definition.name}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              setShowSelector(false);
            }}
            style={{
              fontFamily: tokens.font.mono,
              fontSize: tokens.text.xs,
              border: "2px solid var(--color-gray-700)",
              background: "transparent",
              color: tokens.color.gray300,
              cursor: "pointer",
              padding: "4px 8px",
            }}
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          type="button"
          aria-label="Add effect"
          onClick={() => {
            setShowSelector(true);
          }}
          style={{
            fontFamily: tokens.font.mono,
            fontSize: tokens.text.xs,
            border: "2px solid var(--color-gray-700)",
            background: "transparent",
            color: tokens.color.green,
            cursor: "pointer",
            padding: "4px 8px",
            alignSelf: "flex-start",
          }}
        >
          + INSERT
        </button>
      )}
    </div>
  );
}
