import type { UndoCommand } from "@state/undo/undo-command";
import { useDawStore } from "@state/store";
import { useArpeggiatorStore } from "@state/arpeggiator";
import type { TrackModel, ClipModel } from "@state/track/types";

function getStore(): ReturnType<typeof useDawStore.getState> {
  return useDawStore.getState();
}

// ---------------------------------------------------------------------------
// AddTrackCommand / RemoveTrackCommand
// ---------------------------------------------------------------------------

export class AddTrackCommand implements UndoCommand {
  readonly type = "add-track";

  constructor(
    private readonly track: TrackModel,
    private readonly index?: number,
  ) {}

  execute(): void {
    getStore().addTrack(this.track, this.index);
    useArpeggiatorStore.getState().initArp(this.track.id);
  }

  undo(): void {
    useArpeggiatorStore.getState().removeArp(this.track.id);
    getStore().removeTrack(this.track.id);
  }

  serialize(): Record<string, unknown> {
    return { track: this.track, index: this.index };
  }
}

export class RemoveTrackCommand implements UndoCommand {
  readonly type = "remove-track";

  private savedTrack: TrackModel | undefined;
  private savedClips: readonly ClipModel[] = [];
  private savedIndex = -1;

  constructor(private readonly trackId: string) {}

  execute(): void {
    const state = getStore();
    this.savedIndex = state.tracks.findIndex((t) => t.id === this.trackId);
    this.savedTrack = state.tracks.find((t) => t.id === this.trackId);

    if (this.savedTrack) {
      this.savedClips = this.savedTrack.clipIds
        .map((cid) => state.clips[cid])
        .filter((c): c is ClipModel => c !== undefined);
    }

    useArpeggiatorStore.getState().removeArp(this.trackId);
    state.removeTrack(this.trackId);
  }

  undo(): void {
    if (this.savedTrack === undefined) return;

    // Re-add the track at its original position (without clips first)
    const trackWithoutClips: TrackModel = { ...this.savedTrack, clipIds: [] };
    getStore().addTrack(trackWithoutClips, this.savedIndex);
    useArpeggiatorStore.getState().initArp(this.savedTrack.id);

    // Re-add all clips (addClip also wires up clipIds)
    for (const clip of this.savedClips) {
      getStore().addClip(clip);
    }
  }

  serialize(): Record<string, unknown> {
    return { trackId: this.trackId };
  }
}

// ---------------------------------------------------------------------------
// UpdateTrackCommand
// ---------------------------------------------------------------------------

export class UpdateTrackCommand implements UndoCommand {
  readonly type = "update-track";

  private oldPatch: Partial<Omit<TrackModel, "id">> | undefined;

  constructor(
    private readonly trackId: string,
    private readonly newPatch: Partial<Omit<TrackModel, "id">>,
  ) {}

  execute(): void {
    const track = getStore().tracks.find((t) => t.id === this.trackId);
    if (track === undefined) return;

    // Capture old values for only the keys being changed
    const old: Record<string, unknown> = {};
    for (const key of Object.keys(this.newPatch)) {
      old[key] = track[key as keyof TrackModel];
    }
    this.oldPatch = old as Partial<Omit<TrackModel, "id">>;

    getStore().updateTrack(this.trackId, this.newPatch);
  }

  undo(): void {
    if (this.oldPatch === undefined) return;
    getStore().updateTrack(this.trackId, this.oldPatch);
  }

  serialize(): Record<string, unknown> {
    return {
      trackId: this.trackId,
      newPatch: this.newPatch,
      oldPatch: this.oldPatch,
    };
  }
}

// ---------------------------------------------------------------------------
// ReorderTrackCommand
// ---------------------------------------------------------------------------

export class ReorderTrackCommand implements UndoCommand {
  readonly type = "reorder-track";

  private fromIndex = -1;

  constructor(
    private readonly trackId: string,
    private readonly toIndex: number,
  ) {}

  execute(): void {
    this.fromIndex = getStore().tracks.findIndex((t) => t.id === this.trackId);
    getStore().reorderTrack(this.trackId, this.toIndex);
  }

  undo(): void {
    if (this.fromIndex === -1) return;
    getStore().reorderTrack(this.trackId, this.fromIndex);
  }

  serialize(): Record<string, unknown> {
    return {
      trackId: this.trackId,
      fromIndex: this.fromIndex,
      toIndex: this.toIndex,
    };
  }
}

// ---------------------------------------------------------------------------
// AddClipCommand / RemoveClipCommand
// ---------------------------------------------------------------------------

export class AddClipCommand implements UndoCommand {
  readonly type = "add-clip";

  constructor(private readonly clip: ClipModel) {}

  execute(): void {
    getStore().addClip(this.clip);
  }

  undo(): void {
    getStore().removeClip(this.clip.id);
  }

  serialize(): Record<string, unknown> {
    return { clip: this.clip };
  }
}

export class RemoveClipCommand implements UndoCommand {
  readonly type = "remove-clip";

  private savedClip: ClipModel | undefined;

  constructor(private readonly clipId: string) {}

  execute(): void {
    this.savedClip = getStore().clips[this.clipId];
    getStore().removeClip(this.clipId);
  }

  undo(): void {
    if (this.savedClip === undefined) return;
    getStore().addClip(this.savedClip);
  }

  serialize(): Record<string, unknown> {
    return { clipId: this.clipId };
  }
}

// ---------------------------------------------------------------------------
// MoveClipCommand
// ---------------------------------------------------------------------------

export class MoveClipCommand implements UndoCommand {
  readonly type = "move-clip";

  private oldStartTime = 0;
  private oldTrackId = "";

  constructor(
    private readonly clipId: string,
    private readonly newStartTime: number,
    private readonly newTrackId?: string,
  ) {}

  execute(): void {
    const clip = getStore().clips[this.clipId];
    if (clip === undefined) return;

    this.oldStartTime = clip.startTime;
    this.oldTrackId = clip.trackId;

    getStore().moveClip(this.clipId, this.newStartTime, this.newTrackId);
  }

  undo(): void {
    getStore().moveClip(this.clipId, this.oldStartTime, this.oldTrackId);
  }

  serialize(): Record<string, unknown> {
    return {
      clipId: this.clipId,
      newStartTime: this.newStartTime,
      newTrackId: this.newTrackId,
      oldStartTime: this.oldStartTime,
      oldTrackId: this.oldTrackId,
    };
  }
}

// ---------------------------------------------------------------------------
// SplitClipCommand
// ---------------------------------------------------------------------------

export class SplitClipCommand implements UndoCommand {
  readonly type = "split-clip";

  private originalClip: ClipModel | undefined;
  private generatedRightId: string | undefined;

  constructor(
    private readonly clipId: string,
    private readonly atTime: number,
  ) {}

  rightClipId(): string | undefined {
    return this.generatedRightId;
  }

  execute(): void {
    // Capture full original clip before split
    this.originalClip = getStore().clips[this.clipId];
    // Pass stored ID on redo to keep clip references deterministic
    this.generatedRightId = getStore().splitClip(
      this.clipId,
      this.atTime,
      this.generatedRightId,
    );
  }

  undo(): void {
    if (this.originalClip === undefined) return;

    // Remove the right clip created by split
    if (this.generatedRightId !== undefined) {
      getStore().removeClip(this.generatedRightId);
    }

    // Restore original clip state (splitClip mutated the left clip in-place)
    useDawStore.setState((state) => ({
      clips: { ...state.clips, [this.clipId]: this.originalClip as ClipModel },
    }));
  }

  serialize(): Record<string, unknown> {
    return {
      clipId: this.clipId,
      atTime: this.atTime,
      rightClipId: this.generatedRightId,
      originalClip: this.originalClip,
    };
  }
}

// ---------------------------------------------------------------------------
// TrimClipCommand
// ---------------------------------------------------------------------------

export class TrimClipCommand implements UndoCommand {
  readonly type = "trim-clip";

  private savedClip: ClipModel | undefined;

  constructor(
    private readonly clipId: string,
    private readonly newStart: number | undefined,
    private readonly newEnd: number | undefined,
  ) {}

  execute(): void {
    this.savedClip = getStore().clips[this.clipId];
    getStore().trimClip(this.clipId, this.newStart, this.newEnd);
  }

  undo(): void {
    if (this.savedClip === undefined) return;
    useDawStore.setState((state) => ({
      clips: { ...state.clips, [this.clipId]: this.savedClip as ClipModel },
    }));
  }

  serialize(): Record<string, unknown> {
    return {
      clipId: this.clipId,
      newStart: this.newStart,
      newEnd: this.newEnd,
    };
  }
}

// ---------------------------------------------------------------------------
// DuplicateClipCommand
// ---------------------------------------------------------------------------

export class DuplicateClipCommand implements UndoCommand {
  readonly type = "duplicate-clip";

  private generatedId: string | undefined;

  constructor(private readonly clipId: string) {}

  duplicatedClipId(): string | undefined {
    return this.generatedId;
  }

  execute(): void {
    // Pass stored ID on redo to keep clip references deterministic
    this.generatedId = getStore().duplicateClip(this.clipId, this.generatedId);
  }

  undo(): void {
    if (this.generatedId === undefined) return;
    getStore().removeClip(this.generatedId);
  }

  serialize(): Record<string, unknown> {
    return { clipId: this.clipId, duplicatedId: this.generatedId };
  }
}
