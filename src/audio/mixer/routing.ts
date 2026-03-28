/**
 * E13: Advanced Mixer Routing.
 * Send/return routing, bus/aux tracks, sidechain routing,
 * topological sort for render order, cycle detection.
 */

import { RoutingGraph } from "./cycle-detection";

export type SendRoute = {
  readonly sourceId: string;
  readonly busId: string;
  readonly sendGain: GainNode;
  level: number;
  preFader: boolean;
};

export type BusTrack = {
  readonly id: string;
  readonly inputGain: GainNode;
  readonly faderGain: GainNode;
  readonly analyser: AnalyserNode;
  outputTarget: string; // "master" or another bus id
};

export type SidechainRoute = {
  readonly sourceId: string;
  readonly targetId: string;
  readonly analyser: AnalyserNode;
};

export type RoutingEngine = {
  createBus(id: string): BusTrack;
  removeBus(id: string): void;
  getBus(id: string): BusTrack | undefined;
  getAllBuses(): readonly BusTrack[];
  setBusOutput(busId: string, targetId: string): void;
  getMasterInput(): GainNode;

  addSend(
    sourceId: string,
    busId: string,
    options?: { level?: number; preFader?: boolean },
  ): SendRoute;
  removeSend(sourceId: string, busId: string): void;
  setSendLevel(sourceId: string, busId: string, level: number): void;
  getSends(sourceId: string): readonly SendRoute[];

  addSidechain(sourceId: string, targetId: string): SidechainRoute;
  removeSidechain(sourceId: string, targetId: string): void;
  getSidechains(targetId: string): readonly SidechainRoute[];

  wouldCauseCycle(from: string, to: string): boolean;
  getRenderOrder(): readonly string[];

  dispose(): void;
};

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

/** Kahn's algorithm topological sort */
function topologicalSort(graph: RoutingGraph): readonly string[] {
  const nodes = graph.getNodes();
  if (nodes.length === 0) return [];

  const inDegree = new Map<string, number>();
  for (const n of nodes) inDegree.set(n, 0);

  for (const n of nodes) {
    for (const neighbor of graph.getEdges(n)) {
      inDegree.set(neighbor, (inDegree.get(neighbor) ?? 0) + 1);
    }
  }

  const queue: string[] = [];
  for (const [n, deg] of inDegree) {
    if (deg === 0) queue.push(n);
  }

  const result: string[] = [];
  while (queue.length > 0) {
    const current = queue.shift();
    if (current === undefined) break;
    result.push(current);
    for (const neighbor of graph.getEdges(current)) {
      const newDeg = (inDegree.get(neighbor) ?? 1) - 1;
      inDegree.set(neighbor, newDeg);
      if (newDeg === 0) queue.push(neighbor);
    }
  }

  return result;
}

export function createRoutingEngine(ctx: AudioContext): RoutingEngine {
  const buses = new Map<string, BusTrack>();
  const sends = new Map<string, SendRoute[]>(); // keyed by sourceId
  const sidechains: SidechainRoute[] = [];
  const graph = new RoutingGraph();
  const masterInput = ctx.createGain();

  // Master node in graph
  graph.addNode("master");

  function connectBusOutput(bus: BusTrack): void {
    bus.analyser.disconnect();
    if (bus.outputTarget === "master") {
      bus.analyser.connect(masterInput);
    } else {
      const targetBus = buses.get(bus.outputTarget);
      if (targetBus) {
        bus.analyser.connect(targetBus.inputGain);
      }
    }
  }

  const engine: RoutingEngine = {
    createBus(id: string): BusTrack {
      const existing = buses.get(id);
      if (existing) return existing;

      const inputGain = ctx.createGain();
      const faderGain = ctx.createGain();
      const analyser = ctx.createAnalyser();

      inputGain.connect(faderGain);
      faderGain.connect(analyser);
      analyser.connect(masterInput);

      const bus: BusTrack = {
        id,
        inputGain,
        faderGain,
        analyser,
        outputTarget: "master",
      };
      buses.set(id, bus);

      graph.addNode(id);
      graph.addEdge(id, "master");

      return bus;
    },

    removeBus(id: string): void {
      const bus = buses.get(id);
      if (!bus) return;

      // Re-route buses whose output targeted this bus back to master
      for (const other of buses.values()) {
        if (other.outputTarget === id) {
          graph.removeEdge(other.id, id);
          other.outputTarget = "master";
          graph.addEdge(other.id, "master");
          connectBusOutput(other);
        }
      }

      // Remove all sends targeting this bus
      for (const [sourceId, trackSends] of sends.entries()) {
        const filtered = trackSends.filter((s) => {
          if (s.busId === id) {
            s.sendGain.disconnect();
            graph.removeEdge(sourceId, id);
            return false;
          }
          return true;
        });
        if (filtered.length === 0) {
          sends.delete(sourceId);
          // Prune orphaned source node (not a bus)
          if (!buses.has(sourceId)) graph.removeNode(sourceId);
        } else {
          sends.set(sourceId, filtered);
        }
      }

      // Remove sidechains referencing this bus
      for (let i = sidechains.length - 1; i >= 0; i--) {
        const sc = sidechains[i];
        if (sc && (sc.sourceId === id || sc.targetId === id)) {
          sc.analyser.disconnect();
          sidechains.splice(i, 1);
        }
      }

      bus.inputGain.disconnect();
      bus.faderGain.disconnect();
      bus.analyser.disconnect();
      buses.delete(id);
      graph.removeNode(id);
    },

    getBus(id: string): BusTrack | undefined {
      return buses.get(id);
    },

    getAllBuses(): readonly BusTrack[] {
      return [...buses.values()];
    },

    setBusOutput(busId: string, targetId: string): void {
      const bus = buses.get(busId);
      if (!bus) return;

      if (targetId !== "master" && !buses.has(targetId)) {
        throw new Error(`Bus output target not found: ${targetId}`);
      }

      if (graph.wouldCauseCycle(busId, targetId)) {
        throw new Error(`Routing cycle detected: ${busId} -> ${targetId}`);
      }

      graph.removeEdge(busId, bus.outputTarget);
      bus.outputTarget = targetId;
      graph.addEdge(busId, targetId);
      connectBusOutput(bus);
    },

    getMasterInput(): GainNode {
      return masterInput;
    },

    addSend(
      sourceId: string,
      busId: string,
      options?: { level?: number; preFader?: boolean },
    ): SendRoute {
      const trackSends = sends.get(sourceId) ?? [];

      // Prevent duplicate
      const existing = trackSends.find((s) => s.busId === busId);
      if (existing) return existing;

      const bus = buses.get(busId);
      if (!bus) throw new Error(`Bus not found: ${busId}`);

      if (graph.wouldCauseCycle(sourceId, busId)) {
        throw new Error(`Routing cycle detected: ${sourceId} -> ${busId}`);
      }

      const level = clamp(options?.level ?? 1, 0, 1);
      const preFader = options?.preFader ?? false;

      const sendGain = ctx.createGain();
      sendGain.gain.value = level;
      sendGain.connect(bus.inputGain);

      const send: SendRoute = {
        sourceId,
        busId,
        sendGain,
        level,
        preFader,
      };

      trackSends.push(send);
      sends.set(sourceId, trackSends);

      graph.addNode(sourceId);
      graph.addEdge(sourceId, busId);

      return send;
    },

    removeSend(sourceId: string, busId: string): void {
      const trackSends = sends.get(sourceId);
      if (!trackSends) return;

      const idx = trackSends.findIndex((s) => s.busId === busId);
      if (idx === -1) return;

      const removed = trackSends[idx];
      if (!removed) return;
      removed.sendGain.disconnect();
      trackSends.splice(idx, 1);

      graph.removeEdge(sourceId, busId);

      if (trackSends.length === 0) {
        sends.delete(sourceId);
        // Prune orphaned source node (not a bus)
        if (!buses.has(sourceId)) graph.removeNode(sourceId);
      }
    },

    setSendLevel(sourceId: string, busId: string, level: number): void {
      const trackSends = sends.get(sourceId);
      if (!trackSends) return;

      const send = trackSends.find((s) => s.busId === busId);
      if (!send) return;

      const clamped = clamp(level, 0, 1);
      send.level = clamped;
      send.sendGain.gain.value = clamped;
    },

    getSends(sourceId: string): readonly SendRoute[] {
      return sends.get(sourceId) ?? [];
    },

    addSidechain(sourceId: string, targetId: string): SidechainRoute {
      const existing = sidechains.find(
        (sc) => sc.sourceId === sourceId && sc.targetId === targetId,
      );
      if (existing) return existing;

      const analyser = ctx.createAnalyser();
      const sc: SidechainRoute = { sourceId, targetId, analyser };
      sidechains.push(sc);
      return sc;
    },

    removeSidechain(sourceId: string, targetId: string): void {
      const idx = sidechains.findIndex(
        (sc) => sc.sourceId === sourceId && sc.targetId === targetId,
      );
      if (idx === -1) return;
      const removed = sidechains[idx];
      if (!removed) return;
      removed.analyser.disconnect();
      sidechains.splice(idx, 1);
    },

    getSidechains(targetId: string): readonly SidechainRoute[] {
      return sidechains.filter((sc) => sc.targetId === targetId);
    },

    wouldCauseCycle(from: string, to: string): boolean {
      return graph.wouldCauseCycle(from, to);
    },

    getRenderOrder(): readonly string[] {
      return topologicalSort(graph).filter((n) => n !== "master");
    },

    dispose(): void {
      for (const trackSends of sends.values()) {
        for (const send of trackSends) {
          send.sendGain.disconnect();
        }
      }
      sends.clear();

      for (const sc of sidechains) {
        sc.analyser.disconnect();
      }
      sidechains.length = 0;

      for (const bus of buses.values()) {
        bus.inputGain.disconnect();
        bus.faderGain.disconnect();
        bus.analyser.disconnect();
      }
      buses.clear();

      graph.clear();
      masterInput.disconnect();
    },
  };

  return engine;
}
