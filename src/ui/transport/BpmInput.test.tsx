import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BpmInput } from "./BpmInput";

describe("BpmInput", () => {
  const onChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("displays the current BPM value", () => {
    render(<BpmInput value={120} onChange={onChange} />);
    expect(screen.getByLabelText(/bpm/i)).toHaveValue(120);
  });

  it("calls onChange with new value on blur", () => {
    render(<BpmInput value={120} onChange={onChange} />);
    const input = screen.getByLabelText(/bpm/i);
    fireEvent.change(input, { target: { value: "140" } });
    fireEvent.blur(input);
    expect(onChange).toHaveBeenCalledWith(140);
  });

  it("calls onChange on Enter key", () => {
    render(<BpmInput value={120} onChange={onChange} />);
    const input = screen.getByLabelText(/bpm/i);
    fireEvent.change(input, { target: { value: "85" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onChange).toHaveBeenCalledWith(85);
  });

  it("reverts on Escape key", () => {
    render(<BpmInput value={120} onChange={onChange} />);
    const input = screen.getByLabelText(/bpm/i);
    fireEvent.change(input, { target: { value: "999" } });
    fireEvent.keyDown(input, { key: "Escape" });
    expect(onChange).not.toHaveBeenCalled();
    expect(input).toHaveValue(120);
  });

  it("clamps values below 20 to 20", () => {
    render(<BpmInput value={120} onChange={onChange} />);
    const input = screen.getByLabelText(/bpm/i);
    fireEvent.change(input, { target: { value: "5" } });
    fireEvent.blur(input);
    expect(onChange).toHaveBeenCalledWith(20);
  });

  it("clamps values above 999 to 999", () => {
    render(<BpmInput value={120} onChange={onChange} />);
    const input = screen.getByLabelText(/bpm/i);
    fireEvent.change(input, { target: { value: "2000" } });
    fireEvent.blur(input);
    expect(onChange).toHaveBeenCalledWith(999);
  });

  it("ignores non-numeric input on blur", () => {
    render(<BpmInput value={120} onChange={onChange} />);
    const input = screen.getByLabelText(/bpm/i);
    fireEvent.change(input, { target: { value: "abc" } });
    fireEvent.blur(input);
    expect(onChange).not.toHaveBeenCalled();
    expect(input).toHaveValue(120);
  });
});
