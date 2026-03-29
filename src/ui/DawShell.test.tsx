import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { DawShell } from "./DawShell";
import { createInMemorySessionStorage } from "@state/session/session-storage";

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

describe("DawShell", () => {
  it("renders the complete layout structure", () => {
    const storage = createInMemorySessionStorage();
    render(<DawShell sessionStorage={storage} />);
    expect(screen.getByTestId("daw-shell")).toBeInTheDocument();
    expect(screen.getByTestId("toolbar")).toBeInTheDocument();
    expect(screen.getByTestId("arrangement-panel")).toBeInTheDocument();
    expect(screen.getByTestId("mixer-panel")).toBeInTheDocument();
    expect(screen.getByTestId("instrument-panel")).toBeInTheDocument();
    expect(screen.getByTestId("media-pool-panel")).toBeInTheDocument();
  });
});
