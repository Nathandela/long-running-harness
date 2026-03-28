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
});
