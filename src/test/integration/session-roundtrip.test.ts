/**
 * Integration tests: Session serialization roundtrip [E5->all].
 *
 * Verifies:
 * - Session save/load preserves all state sections
 * - Zod schema validation on load
 * - Store state -> session schema -> JSON -> parse -> store state
 * - All optional sections (effects, modulation, automation, arpeggiator)
 * - InMemorySessionStorage lifecycle
 */

import { describe, it, expect, beforeEach } from "vitest";
import {
  sessionSchema,
  SESSION_VERSION,
  createDefaultSession,
  type SessionSchema,
} from "@state/session/session-schema";
import { createInMemorySessionStorage } from "@state/session/session-storage";
import {
  makeTrack,
  makeAudioClip,
  makeMidiClip,
  makeNoteEvent,
  makeEffectSlot,
  makeModRoute,
  makeAutomationLane,
  makeAutomationPoint,
  resetIdCounter,
} from "./helpers";

function buildFullSession(): SessionSchema {
  const now = Date.now();
  const track1 = makeTrack({ id: "t1", name: "Audio Track", type: "audio" });
  const track2 = makeTrack({
    id: "t2",
    name: "Synth Track",
    type: "instrument",
  });

  const audioClip = makeAudioClip({
    id: "clip-1",
    trackId: "t1",
    sourceId: "src-wav-1",
    startTime: 0,
    duration: 4,
    gain: 0.8,
    fadeIn: 0.1,
    fadeOut: 0.2,
  });

  const midiClip = makeMidiClip({
    id: "clip-2",
    trackId: "t2",
    startTime: 0,
    duration: 8,
    noteEvents: [
      makeNoteEvent({
        id: "n1",
        pitch: 60,
        velocity: 100,
        startTime: 0,
        duration: 0.5,
      }),
      makeNoteEvent({
        id: "n2",
        pitch: 64,
        velocity: 80,
        startTime: 0.5,
        duration: 0.5,
      }),
      makeNoteEvent({
        id: "n3",
        pitch: 67,
        velocity: 90,
        startTime: 1.0,
        duration: 1.0,
      }),
    ],
  });

  return {
    version: SESSION_VERSION,
    meta: { name: "Test Session", createdAt: now, updatedAt: now },
    transport: { bpm: 140, loopEnabled: true, loopStart: 0, loopEnd: 8 },
    tracks: [
      { ...track1, clipIds: ["clip-1"] },
      { ...track2, clipIds: ["clip-2"] },
    ],
    clips: [audioClip, midiClip],
    mixer: { masterVolume: 0.75 },
    effects: [
      {
        trackId: "t2",
        slots: [
          makeEffectSlot({
            id: "fx-1",
            typeId: "reverb",
            params: { decay: 2.5, mix: 0.3 },
          }),
          makeEffectSlot({
            id: "fx-2",
            typeId: "delay",
            params: { time: 0.375, feedback: 0.5, mix: 0.4 },
          }),
        ],
      },
    ],
    modulation: {
      t2: [
        makeModRoute({
          id: "mod-1",
          source: "lfo1",
          destination: "filterCutoff",
          amount: 0.7,
        }),
        makeModRoute({
          id: "mod-2",
          source: "velocity",
          destination: "ampLevel",
          amount: 0.5,
          bipolar: false,
        }),
      ],
    },
    arpeggiator: [
      {
        trackId: "t2",
        params: {
          enabled: true,
          pattern: "up-down",
          rateDivision: "1/16",
          octaveRange: 2,
          octaveDirection: "up",
          gate: 0.8,
          swing: 0.1,
          latch: false,
        },
      },
    ],
    automation: [
      {
        trackId: "t1",
        lanes: [
          {
            ...makeAutomationLane({ id: "lane-1", trackId: "t1" }),
            target: { type: "mixer", param: "volume" },
            points: [
              makeAutomationPoint({ id: "p1", time: 0, value: 0.8 }),
              makeAutomationPoint({ id: "p2", time: 4, value: 0.3 }),
            ],
          },
        ],
      },
    ],
  };
}

describe("Session schema roundtrip", () => {
  beforeEach(() => {
    resetIdCounter();
  });

  it("default session validates against schema", () => {
    const session = createDefaultSession();
    const result = sessionSchema.safeParse(session);
    expect(result.success).toBe(true);
  });

  it("full session with all sections validates", () => {
    const session = buildFullSession();
    const result = sessionSchema.safeParse(session);
    expect(result.success).toBe(true);
  });

  it("JSON serialize -> parse roundtrip preserves all data", () => {
    const original = buildFullSession();
    const json = JSON.stringify(original);
    const parsed: unknown = JSON.parse(json);
    const result = sessionSchema.safeParse(parsed);

    expect(result.success).toBe(true);
    if (!result.success) return;

    const restored = result.data;

    // Meta
    expect(restored.meta.name).toBe(original.meta.name);

    // Transport
    expect(restored.transport.bpm).toBe(140);
    expect(restored.transport.loopEnabled).toBe(true);
    expect(restored.transport.loopStart).toBe(0);
    expect(restored.transport.loopEnd).toBe(8);

    // Tracks
    expect(restored.tracks).toHaveLength(2);
    expect(restored.tracks[0]?.id).toBe("t1");
    expect(restored.tracks[1]?.type).toBe("instrument");

    // Clips
    expect(restored.clips).toHaveLength(2);
    const audioClip = restored.clips.find((c) => c.type === "audio");
    expect(audioClip).toBeDefined();
    if (audioClip?.type === "audio") {
      expect(audioClip.sourceId).toBe("src-wav-1");
    }

    const midiClip = restored.clips.find((c) => c.type === "midi");
    expect(midiClip).toBeDefined();
    if (midiClip?.type === "midi") {
      expect(midiClip.noteEvents).toHaveLength(3);
    }

    // Mixer
    expect(restored.mixer.masterVolume).toBe(0.75);

    // Effects
    expect(restored.effects).toBeDefined();
    expect(restored.effects).toHaveLength(1);
    expect(restored.effects?.[0]?.slots).toHaveLength(2);

    // Modulation
    expect(restored.modulation).toBeDefined();
    if (restored.modulation !== undefined) {
      expect(restored.modulation["t2"]).toHaveLength(2);
    }

    // Arpeggiator
    expect(restored.arpeggiator).toBeDefined();
    expect(restored.arpeggiator).toHaveLength(1);
    expect(restored.arpeggiator?.[0]?.params.pattern).toBe("up-down");

    // Automation
    expect(restored.automation).toBeDefined();
    expect(restored.automation).toHaveLength(1);
    expect(restored.automation?.[0]?.lanes[0]?.points).toHaveLength(2);
  });

  it("rejects invalid session data", () => {
    const invalid = {
      version: 999,
      meta: { name: "Bad" },
    };
    const result = sessionSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("rejects out-of-range BPM", () => {
    const session = createDefaultSession();
    const transport = session.transport as { bpm: number };
    transport.bpm = 0;
    const result = sessionSchema.safeParse(session);
    expect(result.success).toBe(false);
  });

  it("rejects loopEnd < loopStart", () => {
    const session = createDefaultSession();
    const transport = session.transport as {
      loopEnabled: boolean;
      loopStart: number;
      loopEnd: number;
    };
    transport.loopEnabled = true;
    transport.loopStart = 10;
    transport.loopEnd = 5;
    const result = sessionSchema.safeParse(session);
    expect(result.success).toBe(false);
  });
});

describe("Session storage integration", () => {
  it("save and load roundtrip via InMemorySessionStorage", async () => {
    const storage = createInMemorySessionStorage();
    const session = buildFullSession();
    const json = JSON.stringify(session);

    await storage.putCurrent(json);
    const loaded = await storage.getCurrent();
    expect(loaded).toBe(json);

    const parsed = sessionSchema.safeParse(JSON.parse(loaded ?? "{}"));
    expect(parsed.success).toBe(true);
  });

  it("draft save/load/delete lifecycle", async () => {
    const storage = createInMemorySessionStorage();
    const session = createDefaultSession();
    const json = JSON.stringify(session);

    expect(await storage.getDraft()).toBeUndefined();

    await storage.putDraft(json);
    expect(await storage.getDraft()).toBe(json);

    await storage.deleteDraft();
    expect(await storage.getDraft()).toBeUndefined();
  });

  it("named session CRUD operations", async () => {
    const storage = createInMemorySessionStorage();
    const session = buildFullSession();
    const json = JSON.stringify(session);

    await storage.putSession("s1", "My Song", json);
    const list = await storage.listSessions();
    expect(list).toHaveLength(1);
    expect(list[0]?.name).toBe("My Song");

    const loaded = await storage.getSession("s1");
    expect(loaded).toBe(json);

    await storage.renameSession("s1", "My Song v2");
    const list2 = await storage.listSessions();
    expect(list2[0]?.name).toBe("My Song v2");

    await storage.deleteSession("s1");
    expect(await storage.getSession("s1")).toBeUndefined();
    expect(await storage.listSessions()).toHaveLength(0);
  });

  it("backup slot works independently", async () => {
    const storage = createInMemorySessionStorage();

    await storage.putCurrent("current-data");
    await storage.putBackup("backup-data");

    expect(await storage.getCurrent()).toBe("current-data");
    expect(await storage.getBackup()).toBe("backup-data");
  });
});
