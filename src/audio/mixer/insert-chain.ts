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
  replaceInsert(id: string, input: AudioNode, output: AudioNode): void;
  removeInsert(id: string): void;
  getInserts(): readonly InsertEntry[];
  dispose(): void;
};

/** Safe array access for the insert chain */
function at(entries: InsertEntry[], i: number): InsertEntry {
  const e = entries[i];
  if (!e) throw new Error("Insert index out of bounds");
  return e;
}

export function createInsertChain(
  source: AudioNode,
  dest: AudioNode,
): InsertChain {
  const inserts: InsertEntry[] = [];

  // Track the node source currently connects to, so we can disconnect
  // only our connection instead of severing all outgoing connections.
  let sourceTarget: AudioNode = dest;

  function rewire(): void {
    // Disconnect only the chain's own connections
    try {
      source.disconnect(sourceTarget);
    } catch {
      // Target already disconnected — safe to ignore
    }
    for (const entry of inserts) {
      entry.output.disconnect();
    }

    if (inserts.length === 0) {
      source.connect(dest);
      sourceTarget = dest;
      return;
    }

    // source -> first insert input
    const first = at(inserts, 0);
    source.connect(first.input);
    sourceTarget = first.input;

    // Chain inserts: each output -> next input
    for (let i = 0; i < inserts.length - 1; i++) {
      const current = at(inserts, i);
      const next = at(inserts, i + 1);
      current.output.connect(next.input);
    }

    // Last insert output -> dest
    const last = at(inserts, inserts.length - 1);
    last.output.connect(dest);
  }

  // Initial wiring: source -> dest
  source.connect(dest);

  return {
    addInsert(id: string, input: AudioNode, output: AudioNode): void {
      inserts.push({ id, input, output });
      rewire();
    },

    replaceInsert(id: string, input: AudioNode, output: AudioNode): void {
      const idx = inserts.findIndex((e) => e.id === id);
      if (idx === -1) {
        throw new Error(`replaceInsert: insert "${id}" not found in chain`);
      }
      const old = at(inserts, idx);
      old.input.disconnect();
      old.output.disconnect();
      inserts[idx] = { id, input, output };
      rewire();
    },

    removeInsert(id: string): void {
      const idx = inserts.findIndex((e) => e.id === id);
      if (idx === -1) return;
      const removed = at(inserts, idx);
      removed.output.disconnect();
      inserts.splice(idx, 1);
      rewire();
    },

    getInserts(): readonly InsertEntry[] {
      return [...inserts];
    },

    dispose(): void {
      try {
        source.disconnect(sourceTarget);
      } catch {
        // Already disconnected
      }
      for (const entry of inserts) {
        entry.output.disconnect();
      }
      inserts.length = 0;
    },
  };
}
