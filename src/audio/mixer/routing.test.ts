/**
 * Tests for E13: Advanced Mixer Routing.
 * Send/return routing, bus tracks, sidechain routing,
 * topological sort, and extended cycle detection.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { createRoutingEngine, type RoutingEngine } from "./routing";

type MockNode = {
  gain: {
    value: number;
    setValueAtTime: ReturnType<typeof vi.fn>;
    linearRampToValueAtTime: ReturnType<typeof vi.fn>;
  };
  connect: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
};

function createMockAudioContext(): AudioContext {
  const mockGainNode = (): MockNode => ({
    gain: {
      value: 1,
      setValueAtTime: vi.fn(),
      linearRampToValueAtTime: vi.fn(),
    },
    connect: vi.fn().mockReturnThis(),
    disconnect: vi.fn(),
  });

  const mockAnalyser = (): MockNode => ({
    ...mockGainNode(),
    ...{
      fftSize: 2048,
      frequencyBinCount: 1024,
      smoothingTimeConstant: 0.8,
      getFloatTimeDomainData: vi.fn(),
      getByteTimeDomainData: vi.fn(),
    },
  });

  const mockPanner = (): object => ({
    pan: { value: 0, setValueAtTime: vi.fn() },
    connect: vi.fn().mockReturnThis(),
    disconnect: vi.fn(),
  });

  const mockCompressor = (): object => ({
    threshold: { value: -24, setValueAtTime: vi.fn() },
    ratio: { value: 12, setValueAtTime: vi.fn() },
    knee: { value: 30, setValueAtTime: vi.fn() },
    attack: { value: 0.003, setValueAtTime: vi.fn() },
    release: { value: 0.25, setValueAtTime: vi.fn() },
    connect: vi.fn().mockReturnThis(),
    disconnect: vi.fn(),
  });

  return {
    createGain: vi.fn().mockImplementation(mockGainNode),
    createAnalyser: vi.fn().mockImplementation(mockAnalyser),
    createStereoPanner: vi.fn().mockImplementation(mockPanner),
    createDynamicsCompressor: vi.fn().mockImplementation(mockCompressor),
    destination: { connect: vi.fn(), disconnect: vi.fn() },
    currentTime: 0,
    sampleRate: 44100,
  } as unknown as AudioContext;
}

describe("RoutingEngine", () => {
  let ctx: AudioContext;
  let engine: RoutingEngine;

  beforeEach(() => {
    ctx = createMockAudioContext();
    engine = createRoutingEngine(ctx);
  });

  describe("bus track creation", () => {
    it("creates a bus track with unique id", () => {
      const bus = engine.createBus("reverb-bus");
      expect(bus.id).toBe("reverb-bus");
      expect(bus.inputGain).toBeDefined();
      expect(bus.faderGain).toBeDefined();
      expect(bus.analyser).toBeDefined();
    });

    it("returns existing bus for same id", () => {
      const a = engine.createBus("bus-1");
      const b = engine.createBus("bus-1");
      expect(a).toBe(b);
    });

    it("lists all buses", () => {
      engine.createBus("bus-1");
      engine.createBus("bus-2");
      expect(engine.getAllBuses()).toHaveLength(2);
    });

    it("removes a bus and disconnects nodes", () => {
      engine.createBus("bus-1");
      engine.removeBus("bus-1");
      expect(engine.getBus("bus-1")).toBeUndefined();
    });

    it("bus routes to master by default", () => {
      const bus = engine.createBus("bus-1");
      const master = engine.getMasterInput();
      expect(
        (bus.analyser as unknown as MockNode).connect,
      ).toHaveBeenCalledWith(master);
    });
  });

  describe("send routing", () => {
    it("creates a send from track to bus", () => {
      engine.createBus("bus-1");
      const send = engine.addSend("track-1", "bus-1", { level: 0.5 });
      expect(send.sourceId).toBe("track-1");
      expect(send.busId).toBe("bus-1");
      expect(send.level).toBe(0.5);
      expect(send.preFader).toBe(false);
    });

    it("defaults to post-fader send", () => {
      engine.createBus("bus-1");
      const send = engine.addSend("track-1", "bus-1");
      expect(send.preFader).toBe(false);
    });

    it("supports pre-fader sends", () => {
      engine.createBus("bus-1");
      const send = engine.addSend("track-1", "bus-1", { preFader: true });
      expect(send.preFader).toBe(true);
    });

    it("updates send level", () => {
      engine.createBus("bus-1");
      engine.addSend("track-1", "bus-1", { level: 0.3 });
      engine.setSendLevel("track-1", "bus-1", 0.8);
      const sends = engine.getSends("track-1");
      expect(sends[0]?.level).toBeCloseTo(0.8);
    });

    it("clamps send level to 0..1", () => {
      engine.createBus("bus-1");
      engine.addSend("track-1", "bus-1");
      engine.setSendLevel("track-1", "bus-1", 2.0);
      const sends = engine.getSends("track-1");
      expect(sends[0]?.level).toBe(1);
    });

    it("removes a send", () => {
      engine.createBus("bus-1");
      engine.addSend("track-1", "bus-1");
      engine.removeSend("track-1", "bus-1");
      expect(engine.getSends("track-1")).toHaveLength(0);
    });

    it("lists sends for a track", () => {
      engine.createBus("bus-1");
      engine.createBus("bus-2");
      engine.addSend("track-1", "bus-1");
      engine.addSend("track-1", "bus-2");
      expect(engine.getSends("track-1")).toHaveLength(2);
    });

    it("prevents duplicate sends to same bus", () => {
      engine.createBus("bus-1");
      engine.addSend("track-1", "bus-1");
      engine.addSend("track-1", "bus-1");
      expect(engine.getSends("track-1")).toHaveLength(1);
    });

    it("removes all sends when bus is removed", () => {
      engine.createBus("bus-1");
      engine.addSend("track-1", "bus-1");
      engine.addSend("track-2", "bus-1");
      engine.removeBus("bus-1");
      expect(engine.getSends("track-1")).toHaveLength(0);
      expect(engine.getSends("track-2")).toHaveLength(0);
    });

    it("re-routes dependent buses to master when bus is removed", () => {
      engine.createBus("bus-1");
      engine.createBus("bus-2");
      engine.setBusOutput("bus-1", "bus-2");
      expect(engine.getBus("bus-1")?.outputTarget).toBe("bus-2");
      engine.removeBus("bus-2");
      expect(engine.getBus("bus-1")?.outputTarget).toBe("master");
    });

    it("removes sidechains referencing removed bus", () => {
      engine.createBus("bus-1");
      engine.addSidechain("bus-1", "track-1");
      engine.addSidechain("track-2", "bus-1");
      engine.removeBus("bus-1");
      expect(engine.getSidechains("track-1")).toHaveLength(0);
      expect(engine.getSidechains("bus-1")).toHaveLength(0);
    });
  });

  describe("sidechain routing", () => {
    it("creates a sidechain route", () => {
      const sc = engine.addSidechain("track-1", "track-2");
      expect(sc.sourceId).toBe("track-1");
      expect(sc.targetId).toBe("track-2");
    });

    it("returns existing sidechain for same pair", () => {
      const a = engine.addSidechain("track-1", "track-2");
      const b = engine.addSidechain("track-1", "track-2");
      expect(a).toBe(b);
    });

    it("removes a sidechain route", () => {
      engine.addSidechain("track-1", "track-2");
      engine.removeSidechain("track-1", "track-2");
      expect(engine.getSidechains("track-2")).toHaveLength(0);
    });

    it("lists sidechains targeting a track", () => {
      engine.addSidechain("track-1", "track-3");
      engine.addSidechain("track-2", "track-3");
      expect(engine.getSidechains("track-3")).toHaveLength(2);
    });
  });

  describe("cycle detection with sends and buses", () => {
    it("rejects send that would create cycle", () => {
      engine.createBus("bus-1");
      // bus-1 outputs to master, so track -> bus-1 is fine
      engine.addSend("track-1", "bus-1");

      // Now if bus-1 routes back to track-1, that's a cycle
      // (not possible with sends to buses, but bus-to-bus routing could)
      expect(engine.wouldCauseCycle("bus-1", "track-1")).toBe(true);
    });

    it("allows valid send routing", () => {
      engine.createBus("bus-1");
      expect(engine.wouldCauseCycle("track-1", "bus-1")).toBe(false);
    });

    it("detects cycle in bus-to-bus routing", () => {
      engine.createBus("bus-1");
      engine.createBus("bus-2");
      engine.addSend("bus-1", "bus-2");
      // bus-2 -> bus-1 would create cycle
      expect(engine.wouldCauseCycle("bus-2", "bus-1")).toBe(true);
    });

    it("addSend throws on cycle", () => {
      engine.createBus("bus-1");
      engine.createBus("bus-2");
      engine.addSend("bus-1", "bus-2");
      expect(() => {
        engine.addSend("bus-2", "bus-1");
      }).toThrow(/cycle/i);
    });
  });

  describe("topological sort", () => {
    it("returns render order for simple track -> master", () => {
      engine.createBus("bus-1");
      engine.addSend("track-1", "bus-1");
      const order = engine.getRenderOrder();
      // track-1 must come before bus-1
      const trackIdx = order.indexOf("track-1");
      const busIdx = order.indexOf("bus-1");
      expect(trackIdx).toBeLessThan(busIdx);
    });

    it("updates render order when routing changes", () => {
      engine.createBus("bus-1");
      engine.createBus("bus-2");
      engine.addSend("track-1", "bus-1");
      engine.addSend("bus-1", "bus-2");
      const order = engine.getRenderOrder();
      const t1 = order.indexOf("track-1");
      const b1 = order.indexOf("bus-1");
      const b2 = order.indexOf("bus-2");
      expect(t1).toBeLessThan(b1);
      expect(b1).toBeLessThan(b2);
    });

    it("returns empty order for empty graph", () => {
      expect(engine.getRenderOrder()).toEqual([]);
    });
  });

  describe("bus output routing", () => {
    it("routes bus to master by default", () => {
      const bus = engine.createBus("bus-1");
      expect(bus.outputTarget).toBe("master");
    });

    it("routes bus to another bus", () => {
      engine.createBus("bus-1");
      engine.createBus("bus-2");
      engine.setBusOutput("bus-1", "bus-2");
      const bus = engine.getBus("bus-1");
      expect(bus?.outputTarget).toBe("bus-2");
    });

    it("rejects bus output that would create cycle", () => {
      engine.createBus("bus-1");
      engine.createBus("bus-2");
      engine.addSend("bus-1", "bus-2");
      // bus-2 -> bus-1 would cycle
      expect(() => {
        engine.setBusOutput("bus-2", "bus-1");
      }).toThrow(/cycle/i);
    });

    it("rejects bus output to unknown target", () => {
      engine.createBus("bus-1");
      expect(() => {
        engine.setBusOutput("bus-1", "nonexistent");
      }).toThrow(/not found/i);
    });
  });

  describe("dispose", () => {
    it("cleans up all buses and sends", () => {
      engine.createBus("bus-1");
      engine.addSend("track-1", "bus-1");
      engine.addSidechain("track-1", "track-2");
      engine.dispose();
      expect(engine.getAllBuses()).toHaveLength(0);
      expect(engine.getSends("track-1")).toHaveLength(0);
      expect(engine.getSidechains("track-2")).toHaveLength(0);
    });

    it("clears routing graph on dispose", () => {
      engine.createBus("bus-1");
      engine.addSend("track-1", "bus-1");
      engine.dispose();
      expect(engine.getRenderOrder()).toEqual([]);
    });
  });

  describe("removeSend node pruning", () => {
    it("prunes orphaned track node from graph after last send removed", () => {
      engine.createBus("bus-1");
      engine.addSend("track-1", "bus-1");
      engine.removeSend("track-1", "bus-1");
      // track-1 should not appear in render order
      expect(engine.getRenderOrder()).not.toContain("track-1");
    });

    it("keeps bus node in graph after its sends are removed", () => {
      engine.createBus("bus-1");
      engine.createBus("bus-2");
      engine.addSend("bus-1", "bus-2");
      engine.removeSend("bus-1", "bus-2");
      // bus-1 should still be in graph (it's a bus, not just a send source)
      expect(engine.getRenderOrder()).toContain("bus-1");
    });
  });
});
