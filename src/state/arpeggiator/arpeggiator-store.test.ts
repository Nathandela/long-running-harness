import { describe, it, expect, beforeEach } from "vitest";
import { useArpeggiatorStore } from "./arpeggiator-store";
import { DEFAULT_ARP_PARAMS } from "@audio/arpeggiator/arpeggiator-types";

describe("ArpeggiatorStore", () => {
  beforeEach(() => {
    useArpeggiatorStore.setState({ arps: {} });
  });

  it("initializes arp state for a track", () => {
    useArpeggiatorStore.getState().initArp("track-1");
    const arp = useArpeggiatorStore.getState().arps["track-1"];
    expect(arp).toBeDefined();
    expect(arp?.trackId).toBe("track-1");
    expect(arp?.params.pattern).toBe(DEFAULT_ARP_PARAMS.pattern);
    expect(arp?.params.enabled).toBe(false);
  });

  it("does not overwrite existing arp state", () => {
    const { initArp, setParam } = useArpeggiatorStore.getState();
    initArp("track-1");
    setParam("track-1", "pattern", "down");

    initArp("track-1");
    expect(useArpeggiatorStore.getState().arps["track-1"]?.params.pattern).toBe(
      "down",
    );
  });

  it("removes arp state", () => {
    const { initArp, removeArp } = useArpeggiatorStore.getState();
    initArp("track-1");
    removeArp("track-1");
    expect(useArpeggiatorStore.getState().arps["track-1"]).toBeUndefined();
  });

  it("sets a single parameter", () => {
    const { initArp, setParam } = useArpeggiatorStore.getState();
    initArp("track-1");
    setParam("track-1", "gate", 0.5);
    expect(useArpeggiatorStore.getState().arps["track-1"]?.params.gate).toBe(
      0.5,
    );
  });

  it("sets pattern enum parameter", () => {
    const { initArp, setParam } = useArpeggiatorStore.getState();
    initArp("track-1");
    setParam("track-1", "pattern", "random");
    expect(useArpeggiatorStore.getState().arps["track-1"]?.params.pattern).toBe(
      "random",
    );
  });

  it("sets all parameters at once", () => {
    const { initArp, setParams } = useArpeggiatorStore.getState();
    initArp("track-1");
    const newParams = {
      ...DEFAULT_ARP_PARAMS,
      pattern: "down" as const,
      gate: 0.3,
    };
    setParams("track-1", newParams);

    const arp = useArpeggiatorStore.getState().arps["track-1"];
    expect(arp?.params.pattern).toBe("down");
    expect(arp?.params.gate).toBe(0.3);
  });

  it("toggles latch mode", () => {
    const { initArp, setParam } = useArpeggiatorStore.getState();
    initArp("track-1");
    setParam("track-1", "latch", true);
    expect(useArpeggiatorStore.getState().arps["track-1"]?.params.latch).toBe(
      true,
    );
  });

  it("getParams returns defaults for uninitialized track", () => {
    const params = useArpeggiatorStore.getState().getParams("nonexistent");
    expect(params.pattern).toBe(DEFAULT_ARP_PARAMS.pattern);
    expect(params.enabled).toBe(DEFAULT_ARP_PARAMS.enabled);
  });

  it("ignores setParam for uninitialized track", () => {
    useArpeggiatorStore.getState().setParam("nonexistent", "gate", 0.5);
    expect(useArpeggiatorStore.getState().arps["nonexistent"]).toBeUndefined();
  });

  it("ignores removeArp for uninitialized track", () => {
    const before = useArpeggiatorStore.getState().arps;
    useArpeggiatorStore.getState().removeArp("nonexistent");
    expect(useArpeggiatorStore.getState().arps).toBe(before);
  });
});
