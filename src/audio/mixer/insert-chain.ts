/**
 * Insert chain manager for mixer channel strips.
 * Manages a serial chain of effect nodes between source and destination.
 * Re-wires the Web Audio graph when inserts are added/removed.
 */

export type InsertEntry = {
  readonly id: string;
  readonly input: AudioNode;
  readonly output: AudioNode;
};

export type InsertChain = {
  addInsert(id: string, input: AudioNode, output: AudioNode): void;
  removeInsert(id: string): void;
  getInserts(): readonly InsertEntry[];
  dispose(): void;
};

export function createInsertChain(
  source: AudioNode,
  dest: AudioNode,
): InsertChain {
  const inserts: InsertEntry[] = [];

  function rewire(): void {
    // Disconnect everything in the chain
    source.disconnect();
    for (const entry of inserts) {
      entry.output.disconnect();
    }

    if (inserts.length === 0) {
      source.connect(dest);
      return;
    }

    // source -> first insert input
    const first = inserts[0];
    if (first) source.connect(first.input);

    // Chain inserts: each output -> next input
    for (let i = 0; i < inserts.length - 1; i++) {
      const current = inserts[i];
      const next = inserts[i + 1];
      if (current && next) current.output.connect(next.input);
    }

    // Last insert output -> dest
    const last = inserts[inserts.length - 1];
    if (last) last.output.connect(dest);
  }

  // Initial wiring: source -> dest
  source.connect(dest);

  return {
    addInsert(id: string, input: AudioNode, output: AudioNode): void {
      inserts.push({ id, input, output });
      rewire();
    },

    removeInsert(id: string): void {
      const idx = inserts.findIndex((e) => e.id === id);
      if (idx === -1) return;
      inserts.splice(idx, 1);
      rewire();
    },

    getInserts(): readonly InsertEntry[] {
      return [...inserts];
    },

    dispose(): void {
      source.disconnect();
      for (const entry of inserts) {
        entry.output.disconnect();
      }
      inserts.length = 0;
    },
  };
}
