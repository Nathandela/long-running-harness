import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DrumMachinePanel } from "./DrumMachinePanel";
import type {
  DrumInstrumentId,
  DrumInstrumentParams,
} from "@audio/drum-machine/drum-types";

function createMockProps(): ReturnType<typeof buildProps> {
  return buildProps();
}

function buildProps(): {
  pattern: {
    name: string;
    steps: Array<{
      triggers: Record<DrumInstrumentId, boolean>;
      accent: boolean;
      flamMs: number;
    }>;
  };
  currentStep: number;
  activePatternName: string;
  onToggleStep: ReturnType<typeof vi.fn>;
  onSetAccent: ReturnType<typeof vi.fn>;
  onTriggerPad: ReturnType<typeof vi.fn>;
  onParamChange: ReturnType<typeof vi.fn>;
  onSwitchPattern: ReturnType<typeof vi.fn>;
  onClearPattern: ReturnType<typeof vi.fn>;
  params: Record<DrumInstrumentId, DrumInstrumentParams>;
} {
  return {
    pattern: {
      name: "A",
      steps: Array.from({ length: 16 }, () => ({
        triggers: {
          bd: false,
          sd: false,
          lt: false,
          mt: false,
          ht: false,
          rs: false,
          cp: false,
          cb: false,
          oh: false,
          ch: false,
          cy: false,
        },
        accent: false,
        flamMs: 0,
      })),
    },
    currentStep: -1,
    activePatternName: "A",
    onToggleStep: vi.fn(),
    onSetAccent: vi.fn(),
    onTriggerPad: vi.fn(),
    onParamChange: vi.fn(),
    onSwitchPattern: vi.fn(),
    onClearPattern: vi.fn(),
    params: {
      bd: { tone: 1000, decay: 0.5, tune: 1.0, volume: 0.9 },
      sd: { tone: 5000, decay: 0.3, tune: 1.0, volume: 0.8 },
      lt: { tone: 800, decay: 0.4, tune: 0.8, volume: 0.7 },
      mt: { tone: 1200, decay: 0.35, tune: 1.0, volume: 0.7 },
      ht: { tone: 2000, decay: 0.3, tune: 1.2, volume: 0.7 },
      rs: { tone: 8000, decay: 0.1, tune: 1.0, volume: 0.6 },
      cp: { tone: 3000, decay: 0.4, tune: 1.0, volume: 0.75 },
      cb: { tone: 6000, decay: 0.15, tune: 1.0, volume: 0.6 },
      oh: { tone: 10000, decay: 0.5, tune: 1.0, volume: 0.7 },
      ch: { tone: 10000, decay: 0.08, tune: 1.0, volume: 0.7 },
      cy: { tone: 12000, decay: 1.0, tune: 1.0, volume: 0.5 },
    },
  };
}

describe("DrumMachinePanel", () => {
  it("renders the drum machine panel", () => {
    const props = createMockProps();
    render(<DrumMachinePanel {...props} />);
    expect(screen.getByTestId("drum-machine-panel")).toBeInTheDocument();
  });

  it("renders a row for each instrument", () => {
    const props = createMockProps();
    render(<DrumMachinePanel {...props} />);
    expect(screen.getAllByTestId(/^instrument-row-/)).toHaveLength(11);
  });

  it("renders 16 step buttons per instrument", () => {
    const props = createMockProps();
    render(<DrumMachinePanel {...props} />);
    const bdRow = screen.getByTestId("instrument-row-bd");
    const steps = within(bdRow).getAllByRole("button", { name: /Step/ });
    expect(steps).toHaveLength(16);
  });

  it("clicking a step button calls onToggleStep", () => {
    const props = createMockProps();
    render(<DrumMachinePanel {...props} />);
    const bdRow = screen.getByTestId("instrument-row-bd");
    const steps = within(bdRow).getAllByRole("button", { name: /Step/ });
    const firstStep = steps[0];
    if (firstStep) fireEvent.click(firstStep);
    expect(props.onToggleStep).toHaveBeenCalledWith("bd", 0);
  });

  it("renders drum pads for triggering", () => {
    const props = createMockProps();
    render(<DrumMachinePanel {...props} />);
    const bdPad = screen.getByRole("button", { name: "Bass Drum" });
    expect(bdPad).toBeInTheDocument();
  });

  it("clicking a drum pad calls onTriggerPad", () => {
    const props = createMockProps();
    render(<DrumMachinePanel {...props} />);
    const bdPad = screen.getByRole("button", { name: "Bass Drum" });
    fireEvent.pointerDown(bdPad);
    expect(props.onTriggerPad).toHaveBeenCalledWith("bd");
  });

  it("shows pattern A/B buttons", () => {
    const props = createMockProps();
    render(<DrumMachinePanel {...props} />);
    expect(
      screen.getByRole("button", { name: "Pattern A" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Pattern B" }),
    ).toBeInTheDocument();
  });

  it("switching pattern calls onSwitchPattern", () => {
    const props = createMockProps();
    render(<DrumMachinePanel {...props} />);
    fireEvent.click(screen.getByRole("button", { name: "Pattern B" }));
    expect(props.onSwitchPattern).toHaveBeenCalledWith("B");
  });

  it("clear button calls onClearPattern", () => {
    const props = createMockProps();
    render(<DrumMachinePanel {...props} />);
    fireEvent.click(screen.getByRole("button", { name: "Clear" }));
    expect(props.onClearPattern).toHaveBeenCalled();
  });

  it("highlights the current step", () => {
    const props = createMockProps();
    props.currentStep = 3;
    render(<DrumMachinePanel {...props} />);
    const bdRow = screen.getByTestId("instrument-row-bd");
    const steps = within(bdRow).getAllByRole("button", { name: /Step/ });
    const step4 = steps[3];
    if (step4) expect(step4.className).toContain("current");
  });

  it("marks active steps", () => {
    const props = createMockProps();
    const step0 = props.pattern.steps[0];
    if (step0) step0.triggers.bd = true;
    render(<DrumMachinePanel {...props} />);
    const bdRow = screen.getByTestId("instrument-row-bd");
    const steps = within(bdRow).getAllByRole("button", { name: /Step/ });
    const firstStep = steps[0];
    if (firstStep) expect(firstStep).toHaveAttribute("aria-pressed", "true");
  });

  it("renders accent row with 16 buttons", () => {
    const props = createMockProps();
    render(<DrumMachinePanel {...props} />);
    const accentRow = screen.getByTestId("accent-row");
    const buttons = within(accentRow).getAllByRole("button", {
      name: /Accent/,
    });
    expect(buttons).toHaveLength(16);
  });

  it("clicking accent button calls onSetAccent", () => {
    const props = createMockProps();
    render(<DrumMachinePanel {...props} />);
    const accentRow = screen.getByTestId("accent-row");
    const buttons = within(accentRow).getAllByRole("button", {
      name: /Accent/,
    });
    const first = buttons[0];
    if (first) fireEvent.click(first);
    expect(props.onSetAccent).toHaveBeenCalledWith(0, true);
  });

  it("accent button shows active state when accent is true", () => {
    const props = createMockProps();
    const step0 = props.pattern.steps[0];
    if (step0) step0.accent = true;
    render(<DrumMachinePanel {...props} />);
    const accentRow = screen.getByTestId("accent-row");
    const buttons = within(accentRow).getAllByRole("button", {
      name: /Accent/,
    });
    const first = buttons[0];
    if (first) expect(first).toHaveAttribute("aria-pressed", "true");
  });

  describe("roving tabindex keyboard navigation", () => {
    it("only first step has tabIndex=0, rest have tabIndex=-1", () => {
      const props = createMockProps();
      render(<DrumMachinePanel {...props} />);
      const bdRow = screen.getByTestId("instrument-row-bd");
      const steps = within(bdRow).getAllByRole("button", { name: /Step/ });
      expect(steps[0]).toHaveAttribute("tabindex", "0");
      expect(steps[1]).toHaveAttribute("tabindex", "-1");
      expect(steps[15]).toHaveAttribute("tabindex", "-1");
    });

    it("ArrowRight moves focus to next step", async () => {
      const props = createMockProps();
      render(<DrumMachinePanel {...props} />);
      const bdRow = screen.getByTestId("instrument-row-bd");
      const steps = within(bdRow).getAllByRole("button", { name: /Step/ });
      const step1 = steps[0];
      if (step1) {
        step1.focus();
        await userEvent.keyboard("{ArrowRight}");
        expect(steps[1]).toHaveAttribute("tabindex", "0");
        expect(steps[0]).toHaveAttribute("tabindex", "-1");
      }
    });

    it("ArrowLeft moves focus to previous step", async () => {
      const props = createMockProps();
      render(<DrumMachinePanel {...props} />);
      const bdRow = screen.getByTestId("instrument-row-bd");
      const steps = within(bdRow).getAllByRole("button", { name: /Step/ });
      // Move right first
      const step1 = steps[0];
      if (step1) {
        step1.focus();
        await userEvent.keyboard("{ArrowRight}");
        await userEvent.keyboard("{ArrowLeft}");
        expect(steps[0]).toHaveAttribute("tabindex", "0");
      }
    });

    it("ArrowLeft at first step does not wrap", async () => {
      const props = createMockProps();
      render(<DrumMachinePanel {...props} />);
      const bdRow = screen.getByTestId("instrument-row-bd");
      const steps = within(bdRow).getAllByRole("button", { name: /Step/ });
      const step1 = steps[0];
      if (step1) {
        step1.focus();
        await userEvent.keyboard("{ArrowLeft}");
        expect(steps[0]).toHaveAttribute("tabindex", "0");
      }
    });

    it("instrument row has role=group with aria-label", () => {
      const props = createMockProps();
      render(<DrumMachinePanel {...props} />);
      const bdRow = screen.getByTestId("instrument-row-bd");
      expect(bdRow).toHaveAttribute("role", "group");
      expect(bdRow).toHaveAttribute("aria-label", "Bass Drum steps");
    });
  });
});
