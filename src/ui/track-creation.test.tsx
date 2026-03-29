/**
 * Tests for W1: Track Creation & Panel Wiring
 *
 * Covers:
 * - Track type includes "drum"
 * - Add Track button with dropdown in TransportBar
 * - InstrumentPanel shows correct editor per track type
 * - Mixer reacts to new tracks
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { useDawStore } from "@state/store";
import type { TrackModel } from "@state/track/types";

// Mock transport hook for all tests in this file
vi.mock("@audio/use-transport", () => ({
  useTransport: () => ({
    play: vi.fn(),
    pause: vi.fn(),
    stop: vi.fn(),
    seek: vi.fn(),
    setBpm: vi.fn(),
    setMetronomeEnabled: vi.fn(),
    getTransportSAB: () => null,
    getClock: () => null,
    setParamResolver: vi.fn(),
  }),
}));

// Mock synth store
vi.mock("@state/synth/synth-store", () => ({
  useSynthStore: vi.fn(() => ({
    params: {},
    setParam: vi.fn(),
  })),
}));

function makeTrack(
  overrides: Partial<TrackModel> & { id: string; type: TrackModel["type"] },
): TrackModel {
  return {
    name: "Test Track",
    color: "#4A90D9",
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

// -- Track type tests --
describe("TrackType", () => {
  beforeEach(() => {
    useDawStore.setState({ tracks: [], selectedTrackIds: [] });
  });

  it("accepts 'drum' as a valid track type in the store", () => {
    const drumTrack = makeTrack({
      id: "drum-1",
      name: "808",
      type: "drum",
      color: "#FF6B35",
    });
    useDawStore.getState().addTrack(drumTrack);
    const found = useDawStore.getState().tracks.find((t) => t.id === "drum-1");
    expect(found?.type).toBe("drum");
  });
});

// -- Add Track button tests --
describe("AddTrackButton", () => {
  beforeEach(() => {
    useDawStore.setState({ tracks: [], selectedTrackIds: [] });
  });

  it("renders an Add Track button in the toolbar", async () => {
    const { TransportBar } = await import("@ui/transport/TransportBar");
    render(<TransportBar />);
    expect(screen.getByLabelText("Add Track")).toBeInTheDocument();
  });

  it("shows dropdown with Audio, Instrument, Drum options on click", async () => {
    const { TransportBar } = await import("@ui/transport/TransportBar");
    render(<TransportBar />);
    fireEvent.click(screen.getByLabelText("Add Track"));

    expect(screen.getByText("Audio Track")).toBeInTheDocument();
    expect(screen.getByText("Instrument Track")).toBeInTheDocument();
    expect(screen.getByText("Drum Track")).toBeInTheDocument();
  });

  it("adds an audio track when 'Audio Track' is clicked", async () => {
    const { TransportBar } = await import("@ui/transport/TransportBar");
    render(<TransportBar />);
    fireEvent.click(screen.getByLabelText("Add Track"));
    fireEvent.click(screen.getByText("Audio Track"));

    const tracks = useDawStore.getState().tracks;
    expect(tracks).toHaveLength(1);
    expect(tracks[0]?.type).toBe("audio");
  });

  it("adds an instrument track when 'Instrument Track' is clicked", async () => {
    const { TransportBar } = await import("@ui/transport/TransportBar");
    render(<TransportBar />);
    fireEvent.click(screen.getByLabelText("Add Track"));
    fireEvent.click(screen.getByText("Instrument Track"));

    const tracks = useDawStore.getState().tracks;
    expect(tracks).toHaveLength(1);
    expect(tracks[0]?.type).toBe("instrument");
  });

  it("adds a drum track when 'Drum Track' is clicked", async () => {
    const { TransportBar } = await import("@ui/transport/TransportBar");
    render(<TransportBar />);
    fireEvent.click(screen.getByLabelText("Add Track"));
    fireEvent.click(screen.getByText("Drum Track"));

    const tracks = useDawStore.getState().tracks;
    expect(tracks).toHaveLength(1);
    expect(tracks[0]?.type).toBe("drum");
  });

  it("selects the newly created track", async () => {
    const { TransportBar } = await import("@ui/transport/TransportBar");
    render(<TransportBar />);
    fireEvent.click(screen.getByLabelText("Add Track"));
    fireEvent.click(screen.getByText("Drum Track"));

    const selectedIds = useDawStore.getState().selectedTrackIds;
    const tracks = useDawStore.getState().tracks;
    expect(selectedIds).toContain(tracks[0]?.id);
  });
});

// -- InstrumentPanel tests --
describe("InstrumentPanel", () => {
  beforeEach(() => {
    useDawStore.setState({ tracks: [], selectedTrackIds: [] });
  });

  it("shows 'Select a track' when nothing is selected", async () => {
    const { InstrumentPanel } = await import("@ui/panels");
    render(<InstrumentPanel />);
    expect(screen.getByText("Select a track")).toBeInTheDocument();
  });

  it("shows 'AUDIO TRACK' for audio tracks", async () => {
    useDawStore.setState({
      tracks: [makeTrack({ id: "a1", type: "audio" })],
      selectedTrackIds: ["a1"],
    });
    const { InstrumentPanel } = await import("@ui/panels");
    render(<InstrumentPanel />);
    expect(screen.getByText("AUDIO TRACK")).toBeInTheDocument();
  });

  it("shows DrumMachinePanel for drum tracks", async () => {
    useDawStore.setState({
      tracks: [makeTrack({ id: "d1", type: "drum", color: "#FF6B35" })],
      selectedTrackIds: ["d1"],
    });
    const { InstrumentPanel } = await import("@ui/panels");
    render(<InstrumentPanel />);
    expect(screen.getByTestId("drum-machine-panel")).toBeInTheDocument();
  });
});
