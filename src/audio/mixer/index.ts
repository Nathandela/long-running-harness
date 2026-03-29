export type { ChannelStrip, MasterBus, MixerEngine, InsertSlot } from "./types";
export { createMixerEngine } from "./mixer-engine";
export { createInsertChain } from "./insert-chain";
export type { InsertChain, InsertEntry } from "./insert-chain";
/** Cycle detection (INV-1) */
export { RoutingGraph, hasCycle } from "./cycle-detection";
/** E13: Advanced Mixer Routing */
export { createRoutingEngine } from "./routing";
export type {
  RoutingEngine,
  SendRoute,
  BusTrack,
  SidechainRoute,
} from "./routing";
export { createClipScheduler } from "./clip-scheduler";
export type { ClipScheduler } from "./clip-scheduler";
export { faderTaper } from "./fader-taper";
export {
  computePeakAndRms,
  MeterState,
  updateMeterState,
  createAnalyserReader,
  CLIP_THRESHOLD,
  EMERGENCY_MUTE_MS,
} from "./metering";
