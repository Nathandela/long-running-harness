import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { VirtualKeyboard } from "./VirtualKeyboard";

const C3 = 48;
const KEY_ID = "key-" + String(C3);

describe("VirtualKeyboard", () => {
  it("fires noteOn on mouseDown", () => {
    const onNoteOn = vi.fn();
    render(<VirtualKeyboard onNoteOn={onNoteOn} onNoteOff={vi.fn()} />);

    fireEvent.mouseDown(screen.getByTestId(KEY_ID));

    expect(onNoteOn).toHaveBeenCalledOnce();
    expect(onNoteOn).toHaveBeenCalledWith(C3, 100);
  });

  it("fires noteOff on mouseUp", () => {
    const onNoteOff = vi.fn();
    render(<VirtualKeyboard onNoteOn={vi.fn()} onNoteOff={onNoteOff} />);
    const key = screen.getByTestId(KEY_ID);

    fireEvent.mouseDown(key);
    fireEvent.mouseUp(key);

    expect(onNoteOff).toHaveBeenCalledOnce();
    expect(onNoteOff).toHaveBeenCalledWith(C3);
  });

  it("fires noteOff then noteOn on rapid re-trigger of same key", () => {
    const onNoteOn = vi.fn();
    const onNoteOff = vi.fn();
    render(<VirtualKeyboard onNoteOn={onNoteOn} onNoteOff={onNoteOff} />);
    const key = screen.getByTestId(KEY_ID);

    // First press
    fireEvent.mouseDown(key);
    expect(onNoteOn).toHaveBeenCalledTimes(1);
    expect(onNoteOff).not.toHaveBeenCalled();

    // Rapid re-trigger: mouseDown again without mouseUp
    fireEvent.mouseDown(key);
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

  it("fires noteOff on mouseLeave", () => {
    const onNoteOff = vi.fn();
    render(<VirtualKeyboard onNoteOn={vi.fn()} onNoteOff={onNoteOff} />);
    const key = screen.getByTestId(KEY_ID);

    fireEvent.mouseDown(key);
    fireEvent.mouseLeave(key);

    expect(onNoteOff).toHaveBeenCalledOnce();
    expect(onNoteOff).toHaveBeenCalledWith(C3);
  });

  it("does not fire duplicate noteOff on mouseUp after mouseLeave", () => {
    const onNoteOff = vi.fn();
    render(<VirtualKeyboard onNoteOn={vi.fn()} onNoteOff={onNoteOff} />);
    const key = screen.getByTestId(KEY_ID);

    fireEvent.mouseDown(key);
    fireEvent.mouseLeave(key);
    fireEvent.mouseUp(key);

    // Only one noteOff from mouseLeave; mouseUp should not fire another
    expect(onNoteOff).toHaveBeenCalledOnce();
  });
});
