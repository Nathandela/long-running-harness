/**
 * State types for E13 routing.
 * Serializable representations of sends, buses, and sidechains.
 */

export type SendState = {
  readonly busId: string;
  readonly level: number;
  readonly preFader: boolean;
};

export type BusState = {
  readonly id: string;
  readonly name: string;
  readonly outputTarget: string; // "master" or bus id
};

export type SidechainState = {
  readonly sourceId: string;
  readonly targetId: string;
};
