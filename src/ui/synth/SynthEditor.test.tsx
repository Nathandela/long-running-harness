import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SynthEditor } from "./SynthEditor";
import { useSynthStore } from "@state/synth";

describe("SynthEditor", () => {
  const trackId = "test-track";

  beforeEach(() => {
    useSynthStore.setState({ synths: {} });
    useSynthStore.getState().initSynth(trackId);
  });

  it("renders all sections", () => {
    render(<SynthEditor trackId={trackId} />);
    expect(screen.getByTestId("synth-editor")).toBeDefined();
    expect(screen.getByTestId("osc1-section")).toBeDefined();
    expect(screen.getByTestId("osc2-section")).toBeDefined();
    expect(screen.getByTestId("filter-section")).toBeDefined();
    expect(screen.getByTestId("amp-env-section")).toBeDefined();
    expect(screen.getByTestId("filter-env-section")).toBeDefined();
    expect(screen.getByTestId("lfo1-section")).toBeDefined();
    expect(screen.getByTestId("lfo2-section")).toBeDefined();
    expect(screen.getByTestId("master-section")).toBeDefined();
    expect(screen.getByTestId("virtual-keyboard")).toBeDefined();
  });

  it("renders oscillator type selectors", () => {
    render(<SynthEditor trackId={trackId} />);
    const selects = screen.getAllByRole("combobox");
    // 2 osc types + 1 filter type + 2 LFO shapes = 5
    expect(selects.length).toBe(5);
  });

  it("virtual keyboard triggers note callbacks", () => {
    const onNoteOn = vi.fn();
    const onNoteOff = vi.fn();

    render(
      <SynthEditor
        trackId={trackId}
        onNoteOn={onNoteOn}
        onNoteOff={onNoteOff}
      />,
    );

    // C3 = MIDI 48
    const key = screen.getByTestId("key-48");
    fireEvent.mouseDown(key);
    expect(onNoteOn).toHaveBeenCalledWith(48, 100);

    fireEvent.mouseUp(key);
    expect(onNoteOff).toHaveBeenCalledWith(48);
  });

  it("legato toggle updates store", () => {
    render(<SynthEditor trackId={trackId} />);

    const toggle = screen.getByTestId("legato-toggle");
    fireEvent.click(toggle);

    const synth = useSynthStore.getState().synths[trackId];
    expect(synth?.legato).toBe(true);
  });
});
