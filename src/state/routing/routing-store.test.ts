/**
 * Tests for E13 routing state store.
 * Zustand store for sends, buses, and sidechain assignments.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { useRoutingStore } from "./routing-store";

describe("RoutingStore", () => {
  beforeEach(() => {
    useRoutingStore.setState({
      buses: {},
      sends: {},
      sidechains: [],
    });
  });

  describe("bus management", () => {
    it("adds a bus", () => {
      useRoutingStore
        .getState()
        .addBus({ id: "bus-1", name: "Reverb Bus", outputTarget: "master" });
      const bus = useRoutingStore.getState().buses["bus-1"];
      expect(bus).toBeDefined();
      expect(bus?.name).toBe("Reverb Bus");
      expect(bus?.outputTarget).toBe("master");
    });

    it("removes a bus", () => {
      useRoutingStore
        .getState()
        .addBus({ id: "bus-1", name: "Bus", outputTarget: "master" });
      useRoutingStore.getState().removeBus("bus-1");
      expect(useRoutingStore.getState().buses["bus-1"]).toBeUndefined();
    });

    it("removes sends to bus when bus is removed", () => {
      useRoutingStore
        .getState()
        .addBus({ id: "bus-1", name: "Bus", outputTarget: "master" });
      useRoutingStore
        .getState()
        .addSend("track-1", { busId: "bus-1", level: 0.5, preFader: false });
      useRoutingStore.getState().removeBus("bus-1");
      expect(useRoutingStore.getState().getSends("track-1")).toHaveLength(0);
    });

    it("updates bus output target", () => {
      useRoutingStore
        .getState()
        .addBus({ id: "bus-1", name: "Bus 1", outputTarget: "master" });
      useRoutingStore
        .getState()
        .addBus({ id: "bus-2", name: "Bus 2", outputTarget: "master" });
      useRoutingStore.getState().setBusOutput("bus-1", "bus-2");
      expect(useRoutingStore.getState().buses["bus-1"]?.outputTarget).toBe(
        "bus-2",
      );
    });

    it("re-routes dependent buses to master on removal", () => {
      useRoutingStore
        .getState()
        .addBus({ id: "bus-1", name: "Bus 1", outputTarget: "master" });
      useRoutingStore
        .getState()
        .addBus({ id: "bus-2", name: "Bus 2", outputTarget: "master" });
      useRoutingStore.getState().setBusOutput("bus-1", "bus-2");
      useRoutingStore.getState().removeBus("bus-2");
      expect(useRoutingStore.getState().buses["bus-1"]?.outputTarget).toBe(
        "master",
      );
    });

    it("removes sends sourced from the removed bus", () => {
      useRoutingStore
        .getState()
        .addBus({ id: "bus-1", name: "Bus 1", outputTarget: "master" });
      useRoutingStore
        .getState()
        .addBus({ id: "bus-2", name: "Bus 2", outputTarget: "master" });
      useRoutingStore
        .getState()
        .addSend("bus-1", { busId: "bus-2", level: 0.5, preFader: false });
      expect(useRoutingStore.getState().getSends("bus-1")).toHaveLength(1);
      useRoutingStore.getState().removeBus("bus-1");
      expect(useRoutingStore.getState().getSends("bus-1")).toHaveLength(0);
    });

    it("removes sidechains referencing removed bus", () => {
      useRoutingStore
        .getState()
        .addBus({ id: "bus-1", name: "Bus", outputTarget: "master" });
      useRoutingStore
        .getState()
        .addSidechain({ sourceId: "bus-1", targetId: "track-1" });
      useRoutingStore
        .getState()
        .addSidechain({ sourceId: "track-2", targetId: "bus-1" });
      useRoutingStore.getState().removeBus("bus-1");
      expect(useRoutingStore.getState().sidechains).toHaveLength(0);
    });
  });

  describe("send management", () => {
    it("adds a send to a track", () => {
      useRoutingStore
        .getState()
        .addBus({ id: "bus-1", name: "Bus", outputTarget: "master" });
      useRoutingStore
        .getState()
        .addSend("track-1", { busId: "bus-1", level: 0.7, preFader: false });
      const sends = useRoutingStore.getState().getSends("track-1");
      expect(sends).toHaveLength(1);
      expect(sends[0]?.busId).toBe("bus-1");
      expect(sends[0]?.level).toBe(0.7);
    });

    it("removes a send", () => {
      useRoutingStore
        .getState()
        .addBus({ id: "bus-1", name: "Bus", outputTarget: "master" });
      useRoutingStore
        .getState()
        .addSend("track-1", { busId: "bus-1", level: 0.5, preFader: false });
      useRoutingStore.getState().removeSend("track-1", "bus-1");
      expect(useRoutingStore.getState().getSends("track-1")).toHaveLength(0);
    });

    it("updates send level", () => {
      useRoutingStore
        .getState()
        .addBus({ id: "bus-1", name: "Bus", outputTarget: "master" });
      useRoutingStore
        .getState()
        .addSend("track-1", { busId: "bus-1", level: 0.3, preFader: false });
      useRoutingStore.getState().updateSendLevel("track-1", "bus-1", 0.9);
      expect(useRoutingStore.getState().getSends("track-1")[0]?.level).toBe(
        0.9,
      );
    });

    it("toggles pre-fader", () => {
      useRoutingStore
        .getState()
        .addBus({ id: "bus-1", name: "Bus", outputTarget: "master" });
      useRoutingStore
        .getState()
        .addSend("track-1", { busId: "bus-1", level: 0.5, preFader: false });
      useRoutingStore.getState().togglePreFader("track-1", "bus-1");
      expect(useRoutingStore.getState().getSends("track-1")[0]?.preFader).toBe(
        true,
      );
    });

    it("prevents duplicate sends to same bus", () => {
      useRoutingStore
        .getState()
        .addBus({ id: "bus-1", name: "Bus", outputTarget: "master" });
      useRoutingStore
        .getState()
        .addSend("track-1", { busId: "bus-1", level: 0.5, preFader: false });
      useRoutingStore
        .getState()
        .addSend("track-1", { busId: "bus-1", level: 0.8, preFader: true });
      expect(useRoutingStore.getState().getSends("track-1")).toHaveLength(1);
    });

    it("clamps send level to 0..1", () => {
      useRoutingStore
        .getState()
        .addBus({ id: "bus-1", name: "Bus", outputTarget: "master" });
      useRoutingStore
        .getState()
        .addSend("track-1", { busId: "bus-1", level: 0.5, preFader: false });
      useRoutingStore.getState().updateSendLevel("track-1", "bus-1", 2.0);
      expect(useRoutingStore.getState().getSends("track-1")[0]?.level).toBe(1);
      useRoutingStore.getState().updateSendLevel("track-1", "bus-1", -0.5);
      expect(useRoutingStore.getState().getSends("track-1")[0]?.level).toBe(0);
    });

    it("removes all sends for a track", () => {
      useRoutingStore
        .getState()
        .addBus({ id: "bus-1", name: "Bus", outputTarget: "master" });
      useRoutingStore
        .getState()
        .addBus({ id: "bus-2", name: "Bus 2", outputTarget: "master" });
      useRoutingStore
        .getState()
        .addSend("track-1", { busId: "bus-1", level: 0.5, preFader: false });
      useRoutingStore
        .getState()
        .addSend("track-1", { busId: "bus-2", level: 0.5, preFader: false });
      useRoutingStore.getState().removeTrackSends("track-1");
      expect(useRoutingStore.getState().getSends("track-1")).toHaveLength(0);
    });
  });

  describe("sidechain management", () => {
    it("adds a sidechain", () => {
      useRoutingStore
        .getState()
        .addSidechain({ sourceId: "track-1", targetId: "track-2" });
      const scs = useRoutingStore.getState().getSidechains("track-2");
      expect(scs).toHaveLength(1);
      expect(scs[0]?.sourceId).toBe("track-1");
    });

    it("removes a sidechain", () => {
      useRoutingStore
        .getState()
        .addSidechain({ sourceId: "track-1", targetId: "track-2" });
      useRoutingStore.getState().removeSidechain("track-1", "track-2");
      expect(useRoutingStore.getState().getSidechains("track-2")).toHaveLength(
        0,
      );
    });

    it("prevents duplicate sidechains", () => {
      useRoutingStore
        .getState()
        .addSidechain({ sourceId: "track-1", targetId: "track-2" });
      useRoutingStore
        .getState()
        .addSidechain({ sourceId: "track-1", targetId: "track-2" });
      expect(useRoutingStore.getState().getSidechains("track-2")).toHaveLength(
        1,
      );
    });
  });

  describe("serialization", () => {
    it("state is fully serializable", () => {
      useRoutingStore
        .getState()
        .addBus({ id: "bus-1", name: "FX Bus", outputTarget: "master" });
      useRoutingStore
        .getState()
        .addSend("track-1", { busId: "bus-1", level: 0.5, preFader: true });
      useRoutingStore
        .getState()
        .addSidechain({ sourceId: "track-1", targetId: "track-2" });

      const state = useRoutingStore.getState();
      const serialized = JSON.stringify({
        buses: state.buses,
        sends: state.sends,
        sidechains: state.sidechains,
      });
      const parsed = JSON.parse(serialized) as {
        buses: Record<string, unknown>;
        sends: Record<string, unknown[]>;
        sidechains: unknown[];
      };
      expect(parsed.buses["bus-1"]).toBeDefined();
      expect(parsed.sends["track-1"]).toHaveLength(1);
      expect(parsed.sidechains).toHaveLength(1);
    });
  });
});
