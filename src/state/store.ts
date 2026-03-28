import { create } from "zustand";

export type TransportState = "stopped" | "playing" | "paused";

export type AudioEngineStatus =
  | "uninitialized"
  | "suspended"
  | "running"
  | "error";

export type DawStore = {
  // Transport
  transportState: TransportState;
  bpm: number;
  cursorSeconds: number;
  loopEnabled: boolean;
  loopStart: number;
  loopEnd: number;

  // Audio engine
  engineStatus: AudioEngineStatus;

  // Transport actions
  play: () => void;
  pause: () => void;
  stop: () => void;
  setBpm: (bpm: number) => void;
  setCursor: (seconds: number) => void;
  setLoop: (enabled: boolean, start?: number, end?: number) => void;

  // Engine actions
  setEngineStatus: (status: AudioEngineStatus) => void;
};

export const useDawStore = create<DawStore>()((set) => ({
  // Transport defaults
  transportState: "stopped",
  bpm: 120,
  cursorSeconds: 0,
  loopEnabled: false,
  loopStart: 0,
  loopEnd: 0,

  // Engine defaults
  engineStatus: "uninitialized",

  // Transport actions
  play: () => {
    set({ transportState: "playing" });
  },
  pause: () => {
    set({ transportState: "paused" });
  },
  stop: () => {
    set({ transportState: "stopped", cursorSeconds: 0 });
  },
  setBpm: (bpm: number) => {
    const clamped = Math.min(999, Math.max(20, bpm));
    if (!Number.isFinite(clamped)) return;
    set({ bpm: clamped });
  },
  setCursor: (seconds: number) => {
    set({ cursorSeconds: seconds });
  },
  setLoop: (enabled: boolean, start?: number, end?: number) => {
    set((state) => ({
      loopEnabled: enabled,
      loopStart: start ?? state.loopStart,
      loopEnd: end ?? state.loopEnd,
    }));
  },

  // Engine actions
  setEngineStatus: (status: AudioEngineStatus) => {
    set({ engineStatus: status });
  },
}));
