import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useDawStore } from "@state/store";
import type { MidiClipModel } from "@state/track/types";
import { PianoRollEditor } from "./PianoRollEditor";

function makeMidiClip(overrides: Partial<MidiClipModel> = {}): MidiClipModel {
  return {
    type: "midi",
    id: "clip1",
    trackId: "t1",
    startTime: 0,
    duration: 4,
    noteEvents: [],
    name: "MIDI Clip",
    ...overrides,
  };
}

describe("PianoRollEditor", () => {
  beforeEach(() => {
    useDawStore.setState({
      tracks: [],
      clips: {},
      selectedNoteIds: [],
      cursorSeconds: 0,
      bpm: 120,
      transportState: "stopped",
    });
  });

  it("renders without crashing", () => {
    render(<PianoRollEditor clipId={null} />);
    expect(screen.getByTestId("piano-roll-editor")).toBeDefined();
  });

  it("renders canvas element", () => {
    render(<PianoRollEditor clipId={null} />);
    const container = screen.getByTestId("piano-roll-editor");
    const canvas = container.querySelector("canvas");
    expect(canvas).not.toBeNull();
  });

  it("shows toolbar with tool buttons", () => {
    render(<PianoRollEditor clipId={null} />);
    expect(screen.getByTestId("tool-pencil")).toBeDefined();
    expect(screen.getByTestId("tool-select")).toBeDefined();
    expect(screen.getByTestId("tool-erase")).toBeDefined();
  });

  it("shows grid snap selector", () => {
    render(<PianoRollEditor clipId={null} />);
    expect(screen.getByTestId("snap-select")).toBeDefined();
  });

  it("pencil tool button is active by default", () => {
    render(<PianoRollEditor clipId={null} />);
    const pencilBtn = screen.getByTestId("tool-pencil");
    expect(pencilBtn.getAttribute("data-active")).toBe("true");
    const selectBtn = screen.getByTestId("tool-select");
    expect(selectBtn.getAttribute("data-active")).toBe("false");
  });

  it("clicking tool button changes active tool", async () => {
    const user = userEvent.setup();
    render(<PianoRollEditor clipId={null} />);

    const selectBtn = screen.getByTestId("tool-select");
    await user.click(selectBtn);

    expect(selectBtn.getAttribute("data-active")).toBe("true");
    const pencilBtn = screen.getByTestId("tool-pencil");
    expect(pencilBtn.getAttribute("data-active")).toBe("false");
  });

  it("renders with a valid clipId", () => {
    const clip = makeMidiClip({ id: "clip1" });
    useDawStore.setState({ clips: { clip1: clip } });

    render(<PianoRollEditor clipId="clip1" />);
    expect(screen.getByTestId("piano-roll-editor")).toBeDefined();
  });

  // P0-2: Keyboard shortcuts for tool switching (AC-3)
  it("pressing P switches to pencil tool", async () => {
    const user = userEvent.setup();
    render(<PianoRollEditor clipId={null} />);

    // First switch away from pencil
    await user.click(screen.getByTestId("tool-select"));
    expect(screen.getByTestId("tool-select").getAttribute("data-active")).toBe(
      "true",
    );

    // Press P to switch back to pencil
    await user.keyboard("{p}");
    expect(screen.getByTestId("tool-pencil").getAttribute("data-active")).toBe(
      "true",
    );
    expect(screen.getByTestId("tool-select").getAttribute("data-active")).toBe(
      "false",
    );
  });

  it("pressing S switches to select tool", async () => {
    const user = userEvent.setup();
    render(<PianoRollEditor clipId={null} />);

    expect(screen.getByTestId("tool-pencil").getAttribute("data-active")).toBe(
      "true",
    );

    await user.keyboard("{s}");
    expect(screen.getByTestId("tool-select").getAttribute("data-active")).toBe(
      "true",
    );
    expect(screen.getByTestId("tool-pencil").getAttribute("data-active")).toBe(
      "false",
    );
  });

  it("pressing E switches to erase tool", async () => {
    const user = userEvent.setup();
    render(<PianoRollEditor clipId={null} />);

    expect(screen.getByTestId("tool-pencil").getAttribute("data-active")).toBe(
      "true",
    );

    await user.keyboard("{e}");
    expect(screen.getByTestId("tool-erase").getAttribute("data-active")).toBe(
      "true",
    );
    expect(screen.getByTestId("tool-pencil").getAttribute("data-active")).toBe(
      "false",
    );
  });

  // P0-3: Delete key binding exists (AC-4)
  // Full delete behavior is tested in use-piano-roll-interactions.test.ts
  // ("deletes all selected notes" test). The keyboard binding is verified
  // here by checking the ShortcutMap wiring in PianoRollEditor.tsx (lines 117-118).
  // Integration test below confirms the key event reaches the command.
  it("pressing Delete key triggers delete-selected command", async () => {
    const user = userEvent.setup();
    const clip = makeMidiClip({
      id: "clip1",
      noteEvents: [
        {
          id: "n1",
          pitch: 60,
          velocity: 100,
          startTime: 0,
          duration: 0.25,
        },
      ],
    });
    useDawStore.setState({
      clips: { clip1: clip },
      selectedNoteIds: ["n1"],
    });

    render(<PianoRollEditor clipId="clip1" />);

    await user.keyboard("{Delete}");

    const updatedClip = useDawStore.getState().clips["clip1"];
    if (updatedClip && updatedClip.type === "midi") {
      expect(updatedClip.noteEvents.length).toBe(0);
    }
    expect(useDawStore.getState().selectedNoteIds).toEqual([]);
  });
});
