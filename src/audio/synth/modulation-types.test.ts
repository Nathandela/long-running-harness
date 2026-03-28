import { describe, it, expect } from "vitest";
import {
  MOD_SOURCES,
  MOD_DESTINATIONS,
  type ModSource,
  type ModDestination,
  type ModRoute,
  createModRoute,
  PER_VOICE_SOURCES,
  _resetRouteCounter,
} from "./modulation-types";

describe("Modulation Types", () => {
  describe("MOD_SOURCES registry", () => {
    it("contains all 8 modulation sources", () => {
      expect(MOD_SOURCES).toHaveLength(8);
    });

    it("includes LFO1, LFO2", () => {
      expect(MOD_SOURCES).toContain("lfo1");
      expect(MOD_SOURCES).toContain("lfo2");
    });

    it("includes envelopes", () => {
      expect(MOD_SOURCES).toContain("ampEnv");
      expect(MOD_SOURCES).toContain("filterEnv");
    });

    it("includes MIDI sources", () => {
      expect(MOD_SOURCES).toContain("velocity");
      expect(MOD_SOURCES).toContain("aftertouch");
      expect(MOD_SOURCES).toContain("modWheel");
      expect(MOD_SOURCES).toContain("pitchBend");
    });
  });

  describe("MOD_DESTINATIONS registry", () => {
    it("contains all 8 modulation destinations", () => {
      expect(MOD_DESTINATIONS).toHaveLength(8);
    });

    it("includes oscillator destinations", () => {
      expect(MOD_DESTINATIONS).toContain("osc1Pitch");
      expect(MOD_DESTINATIONS).toContain("osc2Pitch");
      expect(MOD_DESTINATIONS).toContain("oscMix");
    });

    it("includes filter destinations", () => {
      expect(MOD_DESTINATIONS).toContain("filterCutoff");
      expect(MOD_DESTINATIONS).toContain("filterResonance");
    });

    it("includes amplitude destination", () => {
      expect(MOD_DESTINATIONS).toContain("ampLevel");
    });

    it("includes LFO rate destinations", () => {
      expect(MOD_DESTINATIONS).toContain("lfo1Rate");
      expect(MOD_DESTINATIONS).toContain("lfo2Rate");
    });
  });

  describe("createModRoute", () => {
    it("creates a route with default amount 0 and bipolar true", () => {
      const route = createModRoute("lfo1", "filterCutoff");
      expect(route.source).toBe("lfo1");
      expect(route.destination).toBe("filterCutoff");
      expect(route.amount).toBe(0);
      expect(route.bipolar).toBe(true);
    });

    it("creates a route with custom amount", () => {
      const route = createModRoute("velocity", "ampLevel", 0.75);
      expect(route.amount).toBe(0.75);
    });

    it("creates a route with custom bipolar flag", () => {
      const route = createModRoute("velocity", "ampLevel", 0.5, false);
      expect(route.bipolar).toBe(false);
    });

    it("generates a unique id", () => {
      const r1 = createModRoute("lfo1", "filterCutoff");
      const r2 = createModRoute("lfo1", "filterCutoff");
      expect(r1.id).not.toBe(r2.id);
    });

    it("clamps amount to [-1, 1]", () => {
      const r1 = createModRoute("lfo1", "filterCutoff", 1.5);
      expect(r1.amount).toBe(1);
      const r2 = createModRoute("lfo1", "filterCutoff", -2);
      expect(r2.amount).toBe(-1);
    });
  });

  describe("PER_VOICE_SOURCES", () => {
    it("contains velocity, ampEnv, filterEnv", () => {
      expect(PER_VOICE_SOURCES.has("velocity")).toBe(true);
      expect(PER_VOICE_SOURCES.has("ampEnv")).toBe(true);
      expect(PER_VOICE_SOURCES.has("filterEnv")).toBe(true);
    });

    it("does not contain global sources", () => {
      expect(PER_VOICE_SOURCES.has("lfo1")).toBe(false);
      expect(PER_VOICE_SOURCES.has("lfo2")).toBe(false);
      expect(PER_VOICE_SOURCES.has("aftertouch")).toBe(false);
      expect(PER_VOICE_SOURCES.has("modWheel")).toBe(false);
      expect(PER_VOICE_SOURCES.has("pitchBend")).toBe(false);
    });
  });

  describe("_resetRouteCounter", () => {
    it("resets counter for deterministic IDs", () => {
      _resetRouteCounter();
      const r1 = createModRoute("lfo1", "filterCutoff");
      _resetRouteCounter();
      const r2 = createModRoute("lfo1", "filterCutoff");
      expect(r1.id).toBe(r2.id);
    });
  });

  describe("ModRoute type validation", () => {
    it("route has correct shape", () => {
      const route: ModRoute = {
        id: "test-id",
        source: "lfo1" as ModSource,
        destination: "filterCutoff" as ModDestination,
        amount: 0.5,
        bipolar: true,
      };
      expect(route.id).toBe("test-id");
      expect(route.source).toBe("lfo1");
      expect(route.destination).toBe("filterCutoff");
      expect(route.amount).toBe(0.5);
      expect(route.bipolar).toBe(true);
    });
  });
});
