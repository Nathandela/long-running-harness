import type { UndoCommand } from "@state/undo/undo-command";
import { useDawStore } from "@state/store";
import type { MIDINoteEvent } from "@state/track/types";
import { isMidiClip } from "@state/track/types";

function getStore(): ReturnType<typeof useDawStore.getState> {
  return useDawStore.getState();
}

export class AddNoteCommand implements UndoCommand {
  readonly type = "add-note";

  constructor(
    private readonly clipId: string,
    private readonly note: MIDINoteEvent,
  ) {}

  execute(): void {
    getStore().addNoteEvent(this.clipId, this.note);
  }

  undo(): void {
    getStore().removeNoteEvent(this.clipId, this.note.id);
  }

  serialize(): Record<string, unknown> {
    return { clipId: this.clipId, note: this.note };
  }
}

export class RemoveNoteCommand implements UndoCommand {
  readonly type = "remove-note";

  private savedNote: MIDINoteEvent | undefined;

  constructor(
    private readonly clipId: string,
    private readonly noteId: string,
  ) {}

  execute(): void {
    const clip = getStore().clips[this.clipId];
    if (clip && isMidiClip(clip)) {
      this.savedNote = clip.noteEvents.find((n) => n.id === this.noteId);
    }
    getStore().removeNoteEvent(this.clipId, this.noteId);
  }

  undo(): void {
    if (this.savedNote) getStore().addNoteEvent(this.clipId, this.savedNote);
  }

  serialize(): Record<string, unknown> {
    return { clipId: this.clipId, noteId: this.noteId };
  }
}

export class MoveNoteCommand implements UndoCommand {
  readonly type = "move-note";

  private oldStartTime: number | undefined;
  private oldPitch: number | undefined;

  constructor(
    private readonly clipId: string,
    private readonly noteId: string,
    private readonly newStartTime: number,
    private readonly newPitch: number,
    oldStartTime?: number,
    oldPitch?: number,
  ) {
    this.oldStartTime = oldStartTime;
    this.oldPitch = oldPitch;
  }

  execute(): void {
    const clip = getStore().clips[this.clipId];
    if (clip && isMidiClip(clip)) {
      const note = clip.noteEvents.find((n) => n.id === this.noteId);
      if (note && this.oldStartTime === undefined) {
        this.oldStartTime = note.startTime;
        this.oldPitch = note.pitch;
      }
    }
    getStore().moveNoteEvent(
      this.clipId,
      this.noteId,
      this.newStartTime,
      this.newPitch,
    );
  }

  undo(): void {
    getStore().moveNoteEvent(
      this.clipId,
      this.noteId,
      this.oldStartTime ?? 0,
      this.oldPitch ?? 0,
    );
  }

  serialize(): Record<string, unknown> {
    return {
      clipId: this.clipId,
      noteId: this.noteId,
      newStartTime: this.newStartTime,
      newPitch: this.newPitch,
      oldStartTime: this.oldStartTime ?? 0,
      oldPitch: this.oldPitch ?? 0,
    };
  }
}

export class ResizeNoteCommand implements UndoCommand {
  readonly type = "resize-note";

  private oldDuration: number | undefined;

  constructor(
    private readonly clipId: string,
    private readonly noteId: string,
    private readonly newDuration: number,
    oldDuration?: number,
  ) {
    this.oldDuration = oldDuration;
  }

  execute(): void {
    const clip = getStore().clips[this.clipId];
    if (clip && isMidiClip(clip)) {
      const note = clip.noteEvents.find((n) => n.id === this.noteId);
      if (note && this.oldDuration === undefined) {
        this.oldDuration = note.duration;
      }
    }
    getStore().resizeNoteEvent(this.clipId, this.noteId, this.newDuration);
  }

  undo(): void {
    getStore().resizeNoteEvent(this.clipId, this.noteId, this.oldDuration ?? 0);
  }

  serialize(): Record<string, unknown> {
    return {
      clipId: this.clipId,
      noteId: this.noteId,
      newDuration: this.newDuration,
      oldDuration: this.oldDuration ?? 0,
    };
  }
}

export class BatchNoteCommand implements UndoCommand {
  readonly type = "batch-note";

  constructor(private readonly commands: UndoCommand[]) {}

  execute(): void {
    for (const cmd of this.commands) cmd.execute();
  }

  undo(): void {
    for (let i = this.commands.length - 1; i >= 0; i--) {
      const cmd = this.commands[i];
      if (cmd) cmd.undo();
    }
  }

  serialize(): Record<string, unknown> {
    return {
      commands: this.commands.map((c) => ({ type: c.type, ...c.serialize() })),
    };
  }
}
