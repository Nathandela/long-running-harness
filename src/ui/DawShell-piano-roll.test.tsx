/**
 * Tests for W3: DawShell bottom panel switching between default and piano-roll views.
 */
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { DawShell } from "./DawShell";
import { createInMemorySessionStorage } from "@state/session/session-storage";
import { useDawStore } from "@state/store";

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

// Mock ArrangementPanel (canvas-based, doesn't render in jsdom)
// and capture the onOpenPianoRoll callback for testing
let capturedOpenPianoRoll: ((clipId: string) => void) | undefined;
vi.mock("@ui/arrangement", () => ({
  ArrangementPanel: ({
    onOpenPianoRoll,
  }: {
    onOpenPianoRoll?: (clipId: string) => void;
  }): React.JSX.Element => {
    capturedOpenPianoRoll = onOpenPianoRoll;
    return <div data-testid="arrangement-panel" />;
  },
}));

describe("DawShell piano roll panel switching", () => {
  beforeEach(() => {
    capturedOpenPianoRoll = undefined;
  });

  it("shows default layout (instrument + media pool) initially", () => {
    const storage = createInMemorySessionStorage();
    render(<DawShell sessionStorage={storage} />);

    expect(screen.getByTestId("instrument-panel")).toBeInTheDocument();
    expect(screen.getByTestId("media-pool-panel")).toBeInTheDocument();
    expect(screen.queryByTestId("piano-roll-editor")).not.toBeInTheDocument();
  });

  it("opens piano roll and close button returns to default", async () => {
    // Set up an instrument track with a MIDI clip
    useDawStore.setState({
      tracks: [
        {
          id: "t1",
          name: "Synth",
          type: "instrument",
          color: "#ff0066",
          muted: false,
          solo: false,
          armed: false,
          soloIsolate: false,
          volume: 1,
          pan: 0,
          clipIds: ["m1"],
        },
      ],
      clips: {
        m1: {
          type: "midi",
          id: "m1",
          trackId: "t1",
          startTime: 0,
          duration: 2,
          noteEvents: [],
          name: "MIDI Clip",
        },
      },
    });

    const storage = createInMemorySessionStorage();
    render(<DawShell sessionStorage={storage} />);

    // Initially shows default layout
    expect(screen.getByTestId("instrument-panel")).toBeInTheDocument();
    expect(screen.queryByTestId("piano-roll-editor")).not.toBeInTheDocument();
    expect(screen.queryByTestId("close-piano-roll")).not.toBeInTheDocument();

    // Trigger piano roll open via captured callback
    if (capturedOpenPianoRoll === undefined) {
      throw new Error("onOpenPianoRoll callback was not captured");
    }
    act(() => {
      capturedOpenPianoRoll("m1");
    });

    // Piano roll should be visible, default panels hidden
    expect(screen.getByTestId("piano-roll-editor")).toBeInTheDocument();
    expect(screen.getByTestId("close-piano-roll")).toBeInTheDocument();
    expect(screen.queryByTestId("instrument-panel")).not.toBeInTheDocument();

    // Click close button to return to default
    await userEvent.click(screen.getByTestId("close-piano-roll"));

    expect(screen.queryByTestId("piano-roll-editor")).not.toBeInTheDocument();
    expect(screen.getByTestId("instrument-panel")).toBeInTheDocument();
  });
});
