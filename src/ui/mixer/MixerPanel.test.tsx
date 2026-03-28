import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { useDawStore } from "@state/store";
import type { TrackModel } from "@state/track/types";
import { MixerPanel } from "./MixerPanel";

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
});
