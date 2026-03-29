import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { VirtualKeyboard } from "./VirtualKeyboard";

const C3 = 48;
const KEY_ID = "key-" + String(C3);

/** Helper: fire pointerDown with setPointerCapture stub */
function pointerDown(el: HTMLElement): void {
  // jsdom doesn't implement setPointerCapture -- stub it
  el.setPointerCapture = vi.fn();
  fireEvent.pointerDown(el, { pointerId: 1 });
}

describe("VirtualKeyboard", () => {
  it("fires noteOn on pointerDown", () => {
    const onNoteOn = vi.fn();
    render(<VirtualKeyboard onNoteOn={onNoteOn} onNoteOff={vi.fn()} />);

    pointerDown(screen.getByTestId(KEY_ID));

    expect(onNoteOn).toHaveBeenCalledOnce();
    expect(onNoteOn).toHaveBeenCalledWith(C3, 100);
  });

  it("fires noteOff on pointerUp", () => {
    const onNoteOff = vi.fn();
    render(<VirtualKeyboard onNoteOn={vi.fn()} onNoteOff={onNoteOff} />);
    const key = screen.getByTestId(KEY_ID);

    pointerDown(key);
    fireEvent.pointerUp(key);

    expect(onNoteOff).toHaveBeenCalledOnce();
    expect(onNoteOff).toHaveBeenCalledWith(C3);
  });

  it("fires noteOff then noteOn on rapid re-trigger of same key", () => {
    const onNoteOn = vi.fn();
    const onNoteOff = vi.fn();
    render(<VirtualKeyboard onNoteOn={onNoteOn} onNoteOff={onNoteOff} />);
    const key = screen.getByTestId(KEY_ID);

    // First press
    pointerDown(key);
    expect(onNoteOn).toHaveBeenCalledTimes(1);
    expect(onNoteOff).not.toHaveBeenCalled();

    // Rapid re-trigger: pointerDown again without pointerUp
    pointerDown(key);
    expect(onNoteOff).toHaveBeenCalledTimes(1);
    expect(onNoteOff).toHaveBeenCalledWith(C3);
    expect(onNoteOn).toHaveBeenCalledTimes(2);

    // Verify order: noteOff was called before second noteOn
    const offOrder = onNoteOff.mock.invocationCallOrder[0];
    const secondOnOrder = onNoteOn.mock.invocationCallOrder[1];
    expect(offOrder).toBeDefined();
    expect(secondOnOrder).toBeDefined();
    if (offOrder !== undefined && secondOnOrder !== undefined) {
      expect(offOrder).toBeLessThan(secondOnOrder);
    }
  });

  it("fires noteOff on pointerLeave", () => {
    const onNoteOff = vi.fn();
    render(<VirtualKeyboard onNoteOn={vi.fn()} onNoteOff={onNoteOff} />);
    const key = screen.getByTestId(KEY_ID);

    pointerDown(key);
    fireEvent.pointerLeave(key);

    expect(onNoteOff).toHaveBeenCalledOnce();
    expect(onNoteOff).toHaveBeenCalledWith(C3);
  });

  it("does not fire duplicate noteOff on pointerUp after pointerLeave", () => {
    const onNoteOff = vi.fn();
    render(<VirtualKeyboard onNoteOn={vi.fn()} onNoteOff={onNoteOff} />);
    const key = screen.getByTestId(KEY_ID);

    pointerDown(key);
    fireEvent.pointerLeave(key);
    fireEvent.pointerUp(key);

    // Only one noteOff from pointerLeave; pointerUp should not fire another
    expect(onNoteOff).toHaveBeenCalledOnce();
  });
});
