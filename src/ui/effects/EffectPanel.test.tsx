import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { EffectPanel } from "./EffectPanel";
import type { EffectDefinition } from "@audio/effects";

const mockDefinition: EffectDefinition = {
  id: "reverb",
  name: "Reverb",
  parameters: [
    {
      name: "Decay",
      key: "decay",
      min: 0.1,
      max: 10,
      default: 2,
      step: 0.1,
      unit: "s",
    },
    {
      name: "Mix",
      key: "mix",
      min: 0,
      max: 100,
      default: 30,
      step: 1,
      unit: "%",
    },
  ],
};

describe("EffectPanel", () => {
  it("renders effect name", () => {
    render(
      <EffectPanel
        definition={mockDefinition}
        params={{ decay: 2, mix: 30 }}
        bypassed={false}
        onParamChange={vi.fn()}
        onBypassToggle={vi.fn()}
        onRemove={vi.fn()}
      />,
    );
    expect(screen.getByText("Reverb")).toBeDefined();
  });

  it("renders parameter knobs", () => {
    render(
      <EffectPanel
        definition={mockDefinition}
        params={{ decay: 2, mix: 30 }}
        bypassed={false}
        onParamChange={vi.fn()}
        onBypassToggle={vi.fn()}
        onRemove={vi.fn()}
      />,
    );
    expect(screen.getByLabelText("Decay")).toBeDefined();
    expect(screen.getByLabelText("Mix")).toBeDefined();
  });

  it("calls onBypassToggle when bypass button clicked", () => {
    const onBypass = vi.fn();
    render(
      <EffectPanel
        definition={mockDefinition}
        params={{ decay: 2, mix: 30 }}
        bypassed={false}
        onParamChange={vi.fn()}
        onBypassToggle={onBypass}
        onRemove={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByLabelText("Bypass"));
    expect(onBypass).toHaveBeenCalledTimes(1);
  });

  it("shows bypass active state", () => {
    render(
      <EffectPanel
        definition={mockDefinition}
        params={{ decay: 2, mix: 30 }}
        bypassed={true}
        onParamChange={vi.fn()}
        onBypassToggle={vi.fn()}
        onRemove={vi.fn()}
      />,
    );

    const bypassBtn = screen.getByLabelText("Bypass");
    expect(bypassBtn.getAttribute("aria-pressed")).toBe("true");
  });

  it("calls onRemove when remove button clicked", () => {
    const onRemove = vi.fn();
    render(
      <EffectPanel
        definition={mockDefinition}
        params={{ decay: 2, mix: 30 }}
        bypassed={false}
        onParamChange={vi.fn()}
        onBypassToggle={vi.fn()}
        onRemove={onRemove}
      />,
    );

    fireEvent.click(screen.getByLabelText("Remove effect"));
    expect(onRemove).toHaveBeenCalledTimes(1);
  });
});
