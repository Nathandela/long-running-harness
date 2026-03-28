import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { createInMemorySessionStorage } from "./session-storage";
import { createDefaultSession } from "./session-schema";
import { useSessionPersistence, hydrateStore } from "./use-session-persistence";
import { useDawStore } from "@state/store";
import { useModulationStore } from "@state/synth/modulation-store";
import { useArpeggiatorStore } from "@state/arpeggiator";
import { DEFAULT_ARP_PARAMS } from "@audio/arpeggiator/arpeggiator-types";
import {
  createModRoute,
  _resetRouteCounter,
} from "@audio/synth/modulation-types";

describe("useSessionPersistence", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useDawStore.setState({
      transportState: "stopped",
      bpm: 120,
      cursorSeconds: 0,
      loopEnabled: false,
      loopStart: 0,
      loopEnd: 0,
      engineStatus: "uninitialized",
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("loads session from storage on mount", async () => {
    const storage = createInMemorySessionStorage();
    const session = createDefaultSession();
    session.transport.bpm = 140;
    await storage.putCurrent(JSON.stringify(session));

    renderHook(() => useSessionPersistence(storage));

    // Allow async loading
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(useDawStore.getState().bpm).toBe(140);
  });

  it("returns recovery warnings for corrupt session", async () => {
    const storage = createInMemorySessionStorage();
    await storage.putCurrent('{"version":1,"transport":"broken"}');

    const { result } = renderHook(() => useSessionPersistence(storage));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });

    expect(result.current.recoveryWarnings.length).toBeGreaterThan(0);
  });

  it("saveNow persists current store state", async () => {
    const storage = createInMemorySessionStorage();
    const { result } = renderHook(() => useSessionPersistence(storage));

    useDawStore.getState().setBpm(160);

    await act(async () => {
      await result.current.saveNow();
    });

    const saved = await storage.getCurrent();
    expect(saved).toBeDefined();
    if (saved === undefined) return;
    const parsed = JSON.parse(saved) as { transport: { bpm: number } };
    expect(parsed.transport.bpm).toBe(160);
  });

  it("auto-saves after debounce on store change", async () => {
    const storage = createInMemorySessionStorage();
    renderHook(() => useSessionPersistence(storage));

    act(() => {
      useDawStore.getState().setBpm(150);
    });

    // Before debounce
    expect(await storage.getCurrent()).toBeUndefined();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(2_000);
    });

    const saved = await storage.getCurrent();
    expect(saved).toBeDefined();
  });

  describe("modulation round-trip", () => {
    it("hydrates modulation routes from session", () => {
      const session = createDefaultSession();
      session.modulation = {
        "track-1": [
          {
            id: "mod-1",
            source: "lfo1",
            destination: "filterCutoff",
            amount: 0.5,
            bipolar: true,
          },
        ],
      };

      hydrateStore(session);

      const routes = useModulationStore.getState().matrices["track-1"]?.routes;
      expect(routes).toHaveLength(1);
      expect(routes?.[0]?.source).toBe("lfo1");
      expect(routes?.[0]?.destination).toBe("filterCutoff");
      expect(routes?.[0]?.amount).toBe(0.5);
    });

    it("seeds route counter to avoid ID collision after hydration", () => {
      _resetRouteCounter();
      const session = createDefaultSession();
      session.modulation = {
        "track-1": [
          {
            id: "mod-5",
            source: "lfo1",
            destination: "filterCutoff",
            amount: 0.5,
            bipolar: true,
          },
        ],
      };

      hydrateStore(session);

      // Next route created should not collide with hydrated mod-5
      const newRoute = createModRoute("lfo2", "osc1Pitch");
      expect(newRoute.id).toBe("mod-6");
    });

    it("enforces MAX_MOD_ROUTES on hydration", () => {
      const session = createDefaultSession();
      // Create 40 routes (exceeds 32 limit)
      const routes = Array.from({ length: 40 }, (_, i) => ({
        id: `mod-${String(i)}`,
        source: "lfo1" as const,
        destination: "filterCutoff" as const,
        amount: 0.1,
        bipolar: true,
      }));
      session.modulation = { "track-1": routes };

      hydrateStore(session);

      expect(
        useModulationStore.getState().matrices["track-1"]?.routes,
      ).toHaveLength(32);
    });
  });

  describe("arpeggiator round-trip", () => {
    it("hydrates arpeggiator state from session", () => {
      const session = createDefaultSession();
      session.arpeggiator = [
        {
          trackId: "track-1",
          params: { ...DEFAULT_ARP_PARAMS, pattern: "down", gate: 0.5 },
        },
      ];

      hydrateStore(session);

      const arp = useArpeggiatorStore.getState().arps["track-1"];
      expect(arp).toBeDefined();
      expect(arp?.params.pattern).toBe("down");
      expect(arp?.params.gate).toBe(0.5);
    });

    it("clears arpeggiator state when session has no arpeggiator section", () => {
      // Pre-populate arp state
      useArpeggiatorStore.getState().initArp("track-1");
      expect(useArpeggiatorStore.getState().arps["track-1"]).toBeDefined();

      const session = createDefaultSession();
      hydrateStore(session);

      expect(useArpeggiatorStore.getState().arps["track-1"]).toBeUndefined();
    });

    it("persists arpeggiator state in saveNow", async () => {
      const storage = createInMemorySessionStorage();
      const { result } = renderHook(() => useSessionPersistence(storage));

      useArpeggiatorStore.getState().initArp("track-1");
      useArpeggiatorStore.getState().setParam("track-1", "pattern", "random");

      await act(async () => {
        await result.current.saveNow();
      });

      const saved = await storage.getCurrent();
      expect(saved).toBeDefined();
      if (saved === undefined) return;
      const parsed = JSON.parse(saved) as {
        arpeggiator?: Array<{
          trackId: string;
          params: { pattern: string };
        }>;
      };
      expect(parsed.arpeggiator).toBeDefined();
      expect(parsed.arpeggiator?.[0]?.trackId).toBe("track-1");
      expect(parsed.arpeggiator?.[0]?.params.pattern).toBe("random");
    });
  });
});
