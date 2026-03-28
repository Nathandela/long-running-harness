import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { EffectsRack } from "./EffectsRack";
import { useEffectsStore } from "@state/effects";
import {
  createEffectRegistry,
  createReverbFactory,
  createDelayFactory,
  createCompressorFactory,
  createEqFactory,
  createDistortionFactory,
  createChorusFactory,
} from "@audio/effects";

// Build a registry outside the mock factory to keep types happy
const testRegistry = createEffectRegistry();
testRegistry.register(createReverbFactory());
testRegistry.register(createDelayFactory());
testRegistry.register(createCompressorFactory());
testRegistry.register(createEqFactory());
testRegistry.register(createDistortionFactory());
testRegistry.register(createChorusFactory());

vi.mock("@audio/effects/EffectsBridgeProvider", () => ({
  useEffectsBridgeContext: () => ({ registry: testRegistry }),
}));

describe("EffectsRack", () => {
  beforeEach(() => {
    useEffectsStore.setState({ trackEffects: {} });
  });

  it("renders empty state when no effects", () => {
    render(<EffectsRack trackId="track-1" />);
    expect(screen.getByTestId("effects-rack")).toBeDefined();
  });

  it("renders add effect button", () => {
    render(<EffectsRack trackId="track-1" />);
    expect(screen.getByLabelText("Add effect")).toBeDefined();
  });

  it("renders effects when track has them", () => {
    useEffectsStore.getState().addEffect("track-1", {
      id: "fx-1",
      typeId: "reverb",
      bypassed: false,
      params: { decay: 2, preDelay: 10, mix: 30 },
    });

    render(<EffectsRack trackId="track-1" />);
    expect(screen.getByText("Reverb")).toBeDefined();
  });

  it("shows effect type selector when add button clicked", () => {
    render(<EffectsRack trackId="track-1" />);
    fireEvent.click(screen.getByLabelText("Add effect"));
    expect(screen.getByText("Delay")).toBeDefined();
    expect(screen.getByText("Compressor")).toBeDefined();
  });
});
