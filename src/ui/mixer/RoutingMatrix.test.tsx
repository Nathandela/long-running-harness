/**
 * Tests for E13 Routing Matrix UI.
 * Visual routing overview for sends, buses, and sidechain assignments.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { useDawStore } from "@state/store";
import { useRoutingStore } from "@state/routing/routing-store";
import type { TrackModel } from "@state/track/types";
import { RoutingMatrix } from "./RoutingMatrix";

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

describe("RoutingMatrix", () => {
  beforeEach(() => {
    useDawStore.setState({
      tracks: [],
      clips: {},
      masterVolume: 1,
    });
    useRoutingStore.setState({
      buses: {},
      sends: {},
      sidechains: [],
    });
  });

  it("renders the routing matrix container", () => {
    render(<RoutingMatrix />);
    expect(screen.getByTestId("routing-matrix")).toBeDefined();
  });

  it("shows track rows when buses exist", () => {
    useDawStore.setState({
      tracks: [
        makeTrack({ id: "t1", name: "Drums" }),
        makeTrack({ id: "t2", name: "Bass" }),
      ],
    });
    useRoutingStore.setState({
      buses: {
        "bus-1": { id: "bus-1", name: "FX Bus", outputTarget: "master" },
      },
    });
    render(<RoutingMatrix />);
    expect(screen.getByText("Drums")).toBeDefined();
    expect(screen.getByText("Bass")).toBeDefined();
  });

  it("shows bus columns", () => {
    useRoutingStore.setState({
      buses: {
        "bus-1": { id: "bus-1", name: "FX Bus", outputTarget: "master" },
      },
    });
    render(<RoutingMatrix />);
    expect(screen.getByText("FX Bus")).toBeDefined();
  });

  it("shows send level for active sends", () => {
    useDawStore.setState({
      tracks: [makeTrack({ id: "t1", name: "Drums" })],
    });
    useRoutingStore.setState({
      buses: {
        "bus-1": { id: "bus-1", name: "FX Bus", outputTarget: "master" },
      },
      sends: {
        t1: [{ busId: "bus-1", level: 0.5, preFader: false }],
      },
    });

    render(<RoutingMatrix />);
    const cell = screen.getByTestId("send-cell-t1-bus-1");
    expect(cell).toBeDefined();
  });

  it("displays bus output target", () => {
    useRoutingStore.setState({
      buses: {
        "bus-1": { id: "bus-1", name: "FX Bus", outputTarget: "master" },
      },
    });
    render(<RoutingMatrix />);
    expect(screen.getByText("-> master")).toBeDefined();
  });

  it("shows sidechain indicators", () => {
    useDawStore.setState({
      tracks: [
        makeTrack({ id: "t1", name: "Kick" }),
        makeTrack({ id: "t2", name: "Bass" }),
      ],
    });
    useRoutingStore.setState({
      buses: {
        "bus-1": { id: "bus-1", name: "FX Bus", outputTarget: "master" },
      },
      sidechains: [{ sourceId: "t1", targetId: "t2" }],
    });
    render(<RoutingMatrix />);
    expect(screen.getAllByTestId("sidechain-t1-t2").length).toBeGreaterThan(0);
  });

  it("shows empty state when no buses exist", () => {
    useDawStore.setState({
      tracks: [makeTrack({ id: "t1", name: "Drums" })],
    });
    render(<RoutingMatrix />);
    expect(screen.getByText(/no buses/i)).toBeDefined();
  });
});
