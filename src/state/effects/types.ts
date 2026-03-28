/**
 * State types for the effects rack.
 * Per-track effect chain stored as serializable state.
 */

export type EffectSlotState = {
  readonly id: string;
  readonly typeId: string;
  readonly bypassed: boolean;
  readonly params: Record<string, number>;
};

export type TrackEffectsState = {
  readonly trackId: string;
  readonly slots: readonly EffectSlotState[];
};
