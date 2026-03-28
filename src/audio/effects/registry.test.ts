import { describe, it, expect, beforeEach, vi } from "vitest";

import { createEffectRegistry } from "./registry";
import type { EffectFactory, EffectInstance, EffectRegistry } from "./types";

type MockedFactory = {
  factory: EffectFactory;
  createSpy: ReturnType<typeof vi.fn>;
};

function mockFactory(id: string): MockedFactory {
  const createSpy = vi.fn().mockReturnValue({
    id: "instance-1",
    typeId: id,
    input: {},
    output: {},
    dryGain: { gain: { value: 1 } },
    wetGain: { gain: { value: 1 } },
    bypassed: false,
    getParam: vi.fn().mockReturnValue(50),
    setParam: vi.fn(),
    setBypassed: vi.fn(),
    setMix: vi.fn(),
    dispose: vi.fn(),
  } as unknown as EffectInstance);

  return {
    createSpy,
    factory: {
      definition: {
        id,
        name: `Test ${id}`,
        parameters: [
          {
            name: "Amount",
            key: "amount",
            min: 0,
            max: 100,
            default: 50,
            step: 1,
            unit: "%",
          },
        ],
      },
      create: createSpy,
    },
  };
}

describe("EffectRegistry", () => {
  let registry: EffectRegistry;

  beforeEach(() => {
    registry = createEffectRegistry();
  });

  it("registers and retrieves a factory by typeId", () => {
    const { factory } = mockFactory("reverb");
    registry.register(factory);
    expect(registry.get("reverb")).toBe(factory);
  });

  it("returns undefined for unregistered typeId", () => {
    expect(registry.get("nonexistent")).toBeUndefined();
  });

  it("getAll returns all registered factories", () => {
    registry.register(mockFactory("reverb").factory);
    registry.register(mockFactory("delay").factory);
    registry.register(mockFactory("compressor").factory);
    expect(registry.getAll()).toHaveLength(3);
  });

  it("create instantiates an effect via factory", () => {
    const { factory, createSpy } = mockFactory("reverb");
    registry.register(factory);
    const ctx = {} as AudioContext;
    const instance = registry.create("reverb", ctx, "my-id");
    expect(createSpy).toHaveBeenCalledWith(ctx, "my-id");
    expect(instance.typeId).toBe("reverb");
  });

  it("create generates an id if not provided", () => {
    const { factory, createSpy } = mockFactory("reverb");
    registry.register(factory);
    const ctx = {} as AudioContext;
    registry.create("reverb", ctx);
    expect(createSpy).toHaveBeenCalledWith(
      ctx,
      expect.stringContaining("reverb-"),
    );
  });

  it("create throws for unregistered typeId", () => {
    expect(() => registry.create("missing", {} as AudioContext)).toThrow(
      "Unknown effect type: missing",
    );
  });

  it("overwrites factory on duplicate registration", () => {
    const { factory: factory1 } = mockFactory("reverb");
    const { factory: factory2 } = mockFactory("reverb");
    registry.register(factory1);
    registry.register(factory2);
    expect(registry.get("reverb")).toBe(factory2);
  });
});
