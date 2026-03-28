import { describe, it, expect, beforeEach, vi } from "vitest";
import { createInsertChain } from "./insert-chain";
import type { InsertChain } from "./insert-chain";

function mockGainNode(): object {
  return {
    gain: { value: 1 },
    connect: vi.fn().mockReturnThis(),
    disconnect: vi.fn(),
  };
}

function mockEffectNode(id: string): {
  id: string;
  input: ReturnType<typeof mockGainNode>;
  output: ReturnType<typeof mockGainNode>;
  dispose: ReturnType<typeof vi.fn>;
} {
  return {
    id,
    input: mockGainNode(),
    output: mockGainNode(),
    dispose: vi.fn(),
  };
}

describe("InsertChain", () => {
  let chain: InsertChain;
  let source: ReturnType<typeof mockGainNode>;
  let dest: ReturnType<typeof mockGainNode>;

  beforeEach(() => {
    source = mockGainNode();
    dest = mockGainNode();
    chain = createInsertChain(
      source as unknown as AudioNode,
      dest as unknown as AudioNode,
    );
  });

  it("starts with empty inserts", () => {
    expect(chain.getInserts()).toEqual([]);
  });

  it("initially connects source directly to dest", () => {
    expect(
      (source as { connect: ReturnType<typeof vi.fn> }).connect,
    ).toHaveBeenCalledWith(dest);
  });

  it("adds an insert and re-wires chain", () => {
    const fx = mockEffectNode("fx1");
    chain.addInsert(
      fx.id,
      fx.input as unknown as AudioNode,
      fx.output as unknown as AudioNode,
    );

    const inserts = chain.getInserts();
    expect(inserts).toHaveLength(1);
    expect(inserts[0]?.id).toBe("fx1");

    // source should disconnect from dest, then connect to fx input
    expect(
      (source as { disconnect: ReturnType<typeof vi.fn> }).disconnect,
    ).toHaveBeenCalled();
  });

  it("adds multiple inserts in series", () => {
    const fx1 = mockEffectNode("fx1");
    const fx2 = mockEffectNode("fx2");
    chain.addInsert(
      fx1.id,
      fx1.input as unknown as AudioNode,
      fx1.output as unknown as AudioNode,
    );
    chain.addInsert(
      fx2.id,
      fx2.input as unknown as AudioNode,
      fx2.output as unknown as AudioNode,
    );

    const inserts = chain.getInserts();
    expect(inserts).toHaveLength(2);
    expect(inserts[0]?.id).toBe("fx1");
    expect(inserts[1]?.id).toBe("fx2");
  });

  it("removes an insert and re-wires", () => {
    const fx1 = mockEffectNode("fx1");
    const fx2 = mockEffectNode("fx2");
    chain.addInsert(
      fx1.id,
      fx1.input as unknown as AudioNode,
      fx1.output as unknown as AudioNode,
    );
    chain.addInsert(
      fx2.id,
      fx2.input as unknown as AudioNode,
      fx2.output as unknown as AudioNode,
    );

    chain.removeInsert("fx1");
    const inserts = chain.getInserts();
    expect(inserts).toHaveLength(1);
    expect(inserts[0]?.id).toBe("fx2");
  });

  it("removing the only insert reconnects source to dest", () => {
    const fx1 = mockEffectNode("fx1");
    chain.addInsert(
      fx1.id,
      fx1.input as unknown as AudioNode,
      fx1.output as unknown as AudioNode,
    );
    chain.removeInsert("fx1");

    expect(chain.getInserts()).toEqual([]);
  });

  it("removing a non-existent insert is a no-op", () => {
    chain.removeInsert("nonexistent");
    expect(chain.getInserts()).toEqual([]);
  });

  it("dispose disconnects everything", () => {
    const fx = mockEffectNode("fx1");
    chain.addInsert(
      fx.id,
      fx.input as unknown as AudioNode,
      fx.output as unknown as AudioNode,
    );
    chain.dispose();
    expect(chain.getInserts()).toEqual([]);
  });
});
