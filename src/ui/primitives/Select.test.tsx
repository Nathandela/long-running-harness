import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { Select } from "./Select";

const defaultOptions = [
  { value: "sine", label: "Sine" },
  { value: "square", label: "Square" },
  { value: "sawtooth", label: "Sawtooth" },
];

describe("Select", () => {
  it("renders a native select element", () => {
    render(
      <Select
        value="sine"
        onChange={vi.fn()}
        options={defaultOptions}
        label="Waveform"
      />,
    );
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("shows all options", () => {
    render(
      <Select
        value="sine"
        onChange={vi.fn()}
        options={defaultOptions}
        label="Waveform"
      />,
    );
    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(3);
    expect(options[0]).toHaveTextContent("Sine");
    expect(options[1]).toHaveTextContent("Square");
    expect(options[2]).toHaveTextContent("Sawtooth");
  });

  it("calls onChange when value changes", async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();

    render(
      <Select
        value="sine"
        onChange={handleChange}
        options={defaultOptions}
        label="Waveform"
      />,
    );

    await user.selectOptions(screen.getByRole("combobox"), "square");
    expect(handleChange).toHaveBeenCalledWith("square");
  });

  it("shows label text", () => {
    render(
      <Select
        value="sine"
        onChange={vi.fn()}
        options={defaultOptions}
        label="Waveform"
      />,
    );
    expect(screen.getByText("Waveform")).toBeInTheDocument();
  });

  it("disabled state prevents interaction", async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();

    render(
      <Select
        value="sine"
        onChange={handleChange}
        options={defaultOptions}
        label="Waveform"
        disabled={true}
      />,
    );

    const select = screen.getByRole("combobox");
    expect(select).toBeDisabled();

    await user.selectOptions(select, "square").catch(() => {
      // Expected: disabled select cannot be interacted with
    });
    expect(handleChange).not.toHaveBeenCalled();
  });

  it("has correct aria-label", () => {
    render(
      <Select
        value="sine"
        onChange={vi.fn()}
        options={defaultOptions}
        label="Waveform"
      />,
    );
    expect(screen.getByRole("combobox")).toHaveAccessibleName("Waveform");
  });
});
