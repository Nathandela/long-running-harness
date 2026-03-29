import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { useDawStore } from "@state/store";
import { useEffectsStore } from "@state/effects";
import type { TrackModel } from "@state/track/types";
import {
  createEffectRegistry,
  createReverbFactory,
  createDelayFactory,
} from "@audio/effects";
import { MixerPanel } from "./MixerPanel";

const testRegistry = createEffectRegistry();
testRegistry.register(createReverbFactory());
testRegistry.register(createDelayFactory());

vi.mock("./useMeterData", () => ({
  useMeterData: () => ({
    channels: {},
    master: { level: 0, peak: 0, clipping: false },
  }),
}));

vi.mock("@audio/effects/EffectsBridgeProvider", () => ({
  useEffectsBridgeContext: () => ({ registry: testRegistry }),
}));

function makeTrack(overrides: Partial<TrackModel> = {}): TrackModel {
  return {
    id: "track-1",
    name: "Track 1",
    type: "audio",
    color: "#0066ff",
    muted: false,
    solo: false,
    armed: false,
    soloIsolate: false,
    volume: 1,
    pan: 0,
    clipIds: [],
    ...overrides,
  };
}

describe("MixerPanel", () => {
  beforeEach(() => {
    useDawStore.setState({
      tracks: [],
      clips: {},
      masterVolume: 1,
    });
  });

  it("renders the mixer panel", () => {
    render(<MixerPanel />);
    expect(screen.getByTestId("mixer-panel")).toBeDefined();
  });

  it("shows empty state when no tracks exist", () => {
    render(<MixerPanel />);
    expect(screen.getByText(/No tracks yet/)).toBeDefined();
  });

  it("renders the master strip", () => {
    render(<MixerPanel />);
    expect(screen.getByTestId("master-strip")).toBeDefined();
  });

  it("renders channel strips for each track", () => {
    useDawStore.setState({
      tracks: [
        makeTrack({ id: "t1", name: "Drums" }),
        makeTrack({ id: "t2", name: "Bass" }),
      ],
    });

    render(<MixerPanel />);
    expect(screen.getByTestId("channel-strip-t1")).toBeDefined();
    expect(screen.getByTestId("channel-strip-t2")).toBeDefined();
  });

  it("shows track names", () => {
    useDawStore.setState({
      tracks: [makeTrack({ id: "t1", name: "Drums" })],
    });

    render(<MixerPanel />);
    expect(screen.getByText("Drums")).toBeDefined();
  });

  it("toggles mute on button click", () => {
    useDawStore.setState({
      tracks: [makeTrack({ id: "t1", muted: false })],
    });

    render(<MixerPanel />);
    const muteBtn = screen.getByLabelText("Mute");
    fireEvent.click(muteBtn);

    const state = useDawStore.getState();
    expect(state.tracks[0]?.muted).toBe(true);
  });

  it("toggles solo on button click", () => {
    useDawStore.setState({
      tracks: [makeTrack({ id: "t1", solo: false })],
    });

    render(<MixerPanel />);
    const soloBtn = screen.getByLabelText("Solo");
    fireEvent.click(soloBtn);

    const state = useDawStore.getState();
    expect(state.tracks[0]?.solo).toBe(true);
  });

  it("displays MASTER label on master strip", () => {
    render(<MixerPanel />);
    expect(screen.getByText("MASTER")).toBeDefined();
  });

  it("renders FX button on each channel strip", () => {
    useDawStore.setState({
      tracks: [makeTrack({ id: "t1", name: "Drums" })],
    });
    render(<MixerPanel />);
    expect(screen.getByLabelText("Toggle effects for Drums")).toBeDefined();
  });

  it("shows EffectsRack when FX button is clicked", () => {
    useDawStore.setState({
      tracks: [makeTrack({ id: "t1", name: "Drums" })],
    });
    useEffectsStore.setState({ trackEffects: {} });

    render(<MixerPanel />);
    fireEvent.click(screen.getByLabelText("Toggle effects for Drums"));
    expect(screen.getByTestId("effects-rack")).toBeDefined();
  });

  it("hides EffectsRack when FX button is clicked again", () => {
    useDawStore.setState({
      tracks: [makeTrack({ id: "t1", name: "Drums" })],
    });
    useEffectsStore.setState({ trackEffects: {} });

    render(<MixerPanel />);
    const fxBtn = screen.getByLabelText("Toggle effects for Drums");
    fireEvent.click(fxBtn);
    expect(screen.getByTestId("effects-rack")).toBeDefined();
    fireEvent.click(fxBtn);
    expect(screen.queryByTestId("effects-rack")).toBeNull();
  });

  it("switches EffectsRack to different track when another FX button is clicked", () => {
    useDawStore.setState({
      tracks: [
        makeTrack({ id: "t1", name: "Drums" }),
        makeTrack({ id: "t2", name: "Bass" }),
      ],
    });
    useEffectsStore.setState({ trackEffects: {} });

    render(<MixerPanel />);
    fireEvent.click(screen.getByLabelText("Toggle effects for Drums"));
    expect(screen.getByTestId("effects-rack")).toBeDefined();

    fireEvent.click(screen.getByLabelText("Toggle effects for Bass"));
    expect(screen.getByTestId("effects-rack")).toBeDefined();
  });

  it("renders ROUTING toggle button", () => {
    render(<MixerPanel />);
    expect(screen.getByLabelText("Toggle routing matrix")).toBeDefined();
  });

  it("shows RoutingMatrix when ROUTING button is clicked", () => {
    useDawStore.setState({
      tracks: [makeTrack({ id: "t1", name: "Drums" })],
    });
    render(<MixerPanel />);
    fireEvent.click(screen.getByLabelText("Toggle routing matrix"));
    expect(screen.getByTestId("routing-matrix")).toBeDefined();
  });

  it("hides RoutingMatrix when ROUTING button is clicked again", () => {
    render(<MixerPanel />);
    const btn = screen.getByLabelText("Toggle routing matrix");
    fireEvent.click(btn);
    expect(screen.getByTestId("routing-matrix")).toBeDefined();
    fireEvent.click(btn);
    expect(screen.queryByTestId("routing-matrix")).toBeNull();
  });
});
