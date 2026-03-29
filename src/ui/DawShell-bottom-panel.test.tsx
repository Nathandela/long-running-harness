/**
 * Tests for BUG 7: conditional bottom panel layout.
 * - Instrument/drum track selected -> InstrumentPanel full width, no media pool
 * - Audio/no track selected -> both panels side-by-side
 * - Toggle button switches between instrument and media pool views
 */
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { DawShell } from "./DawShell";
import { createInMemorySessionStorage } from "@state/session/session-storage";
import { useDawStore } from "@state/store";
import type { TrackModel } from "@state/track/types";

vi.mock("@audio/transport-provider", () => ({
  TransportProvider: ({
    children,
  }: {
    children: React.ReactNode;
  }): React.ReactNode => children,
}));

vi.mock("@audio/effects/EffectsBridgeProvider", () => ({
  EffectsBridgeProvider: ({
    children,
  }: {
    children: React.ReactNode;
  }): React.ReactNode => children,
}));

vi.mock("@audio/mixer/RoutingBridgeProvider", () => ({
  RoutingBridgeProvider: ({
    children,
  }: {
    children: React.ReactNode;
  }): React.ReactNode => children,
}));

vi.mock("@audio/TrackAudioBridgeProvider", () => ({
  TrackAudioBridgeProvider: ({
    children,
  }: {
    children: React.ReactNode;
  }): React.ReactNode => children,
  useTrackAudioBridge: () => ({
    getInstrument: () => undefined,
    getDrumKit: () => undefined,
    dispose: vi.fn(),
  }),
}));

vi.mock("@audio/use-transport", () => ({
  useTransport: (): object => ({
    play: vi.fn(),
    pause: vi.fn(),
    stop: vi.fn(),
    seek: vi.fn(),
    setBpm: vi.fn(),
    setMetronomeEnabled: vi.fn(),
    getTransportSAB: vi.fn().mockReturnValue(null),
    getClock: vi.fn().mockReturnValue(null),
  }),
}));

vi.mock("@ui/hooks/useTransportCursor", () => ({
  useTransportCursor: (): { current: number } => ({ current: 0 }),
}));

vi.mock("@ui/mixer/useMeterData", () => ({
  useMeterData: () => ({
    channels: {},
    master: { level: 0, peak: 0, clipping: false },
  }),
}));

vi.mock("@audio/media-pool/use-media-pool", () => ({
  useMediaPool: (): object => ({
    importFile: vi.fn(),
    getSource: () => undefined,
    getAudioBuffer: vi.fn().mockResolvedValue(undefined),
    getPeaks: vi.fn().mockResolvedValue(undefined),
    listSources: () => [],
    removeSource: vi.fn(),
    count: 0,
    init: vi.fn().mockResolvedValue(undefined),
  }),
}));

vi.mock("@ui/arrangement", () => ({
  ArrangementPanel: (): React.JSX.Element => (
    <div data-testid="arrangement-panel" />
  ),
}));

const mockAudioEngine = { ctx: { sampleRate: 44100 }, resume: vi.fn() };
vi.mock("@audio/use-audio-engine", () => ({
  useAudioEngine: () => mockAudioEngine,
}));

function makeTrack(
  overrides: Partial<TrackModel> & { id: string; type: TrackModel["type"] },
): TrackModel {
  return {
    name: "Track",
    color: "#ff0066",
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

describe("DawShell bottom panel conditional layout", () => {
  beforeEach(() => {
    useDawStore.setState({
      tracks: [],
      selectedTrackIds: [],
      clips: {},
    });
  });

  it("shows both panels side-by-side when no track is selected", () => {
    const storage = createInMemorySessionStorage();
    render(<DawShell sessionStorage={storage} />);

    expect(screen.getByTestId("instrument-panel")).toBeInTheDocument();
    expect(screen.getByTestId("media-pool-panel")).toBeInTheDocument();
  });

  it("shows both panels side-by-side when audio track is selected", () => {
    useDawStore.setState({
      tracks: [makeTrack({ id: "t1", type: "audio" })],
      selectedTrackIds: ["t1"],
    });

    const storage = createInMemorySessionStorage();
    render(<DawShell sessionStorage={storage} />);

    expect(screen.getByTestId("instrument-panel")).toBeInTheDocument();
    expect(screen.getByTestId("media-pool-panel")).toBeInTheDocument();
  });

  it("hides media pool when instrument track is selected", () => {
    useDawStore.setState({
      tracks: [makeTrack({ id: "t1", type: "instrument" })],
      selectedTrackIds: ["t1"],
    });

    const storage = createInMemorySessionStorage();
    render(<DawShell sessionStorage={storage} />);

    expect(screen.getByTestId("instrument-panel")).toBeInTheDocument();
    expect(screen.queryByTestId("media-pool-panel")).not.toBeInTheDocument();
  });

  it("hides media pool when drum track is selected", () => {
    useDawStore.setState({
      tracks: [makeTrack({ id: "t1", type: "drum" })],
      selectedTrackIds: ["t1"],
    });

    const storage = createInMemorySessionStorage();
    render(<DawShell sessionStorage={storage} />);

    expect(screen.getByTestId("instrument-panel")).toBeInTheDocument();
    expect(screen.queryByTestId("media-pool-panel")).not.toBeInTheDocument();
  });

  it("shows a media pool toggle button when instrument/drum track is selected", () => {
    useDawStore.setState({
      tracks: [makeTrack({ id: "t1", type: "instrument" })],
      selectedTrackIds: ["t1"],
    });

    const storage = createInMemorySessionStorage();
    render(<DawShell sessionStorage={storage} />);

    expect(screen.getByTestId("toggle-media-pool")).toBeInTheDocument();
  });

  it("clicking toggle switches to media pool view and back", async () => {
    useDawStore.setState({
      tracks: [makeTrack({ id: "t1", type: "instrument" })],
      selectedTrackIds: ["t1"],
    });

    const storage = createInMemorySessionStorage();
    render(<DawShell sessionStorage={storage} />);

    // Initially: instrument panel visible, media pool hidden
    expect(screen.getByTestId("instrument-panel")).toBeInTheDocument();
    expect(screen.queryByTestId("media-pool-panel")).not.toBeInTheDocument();

    // Click toggle to show media pool
    await userEvent.click(screen.getByTestId("toggle-media-pool"));
    expect(screen.getByTestId("media-pool-panel")).toBeInTheDocument();
    expect(screen.queryByTestId("instrument-panel")).not.toBeInTheDocument();

    // Click toggle again to go back to instrument
    await userEvent.click(screen.getByTestId("toggle-media-pool"));
    expect(screen.getByTestId("instrument-panel")).toBeInTheDocument();
    expect(screen.queryByTestId("media-pool-panel")).not.toBeInTheDocument();
  });

  it("resets to instrument view when switching from audio to instrument track", () => {
    useDawStore.setState({
      tracks: [
        makeTrack({ id: "t1", type: "audio" }),
        makeTrack({ id: "t2", type: "instrument" }),
      ],
      selectedTrackIds: ["t1"],
    });

    const storage = createInMemorySessionStorage();
    render(<DawShell sessionStorage={storage} />);

    // Audio track: both panels visible
    expect(screen.getByTestId("instrument-panel")).toBeInTheDocument();
    expect(screen.getByTestId("media-pool-panel")).toBeInTheDocument();

    // Select instrument track
    act(() => {
      useDawStore.setState({ selectedTrackIds: ["t2"] });
    });

    // Should show instrument panel only
    expect(screen.getByTestId("instrument-panel")).toBeInTheDocument();
    expect(screen.queryByTestId("media-pool-panel")).not.toBeInTheDocument();
  });
});
