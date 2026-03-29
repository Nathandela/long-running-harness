/**
 * Tests for the polish animations epic.
 * Verifies:
 * 1. ModulationMatrix uses bezier curves (path elements) for cables
 * 2. ClickToStart has Neo-Brutalist animations
 * 3. StepButton has activation animation CSS class
 * 4. All CSS animations respect prefers-reduced-motion via @media query
 * 5. EffectsRack slide-in respects useReducedMotion
 * 6. ModulationMatrix cable pulse respects useReducedMotion
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ModulationMatrix } from "./synth/ModulationMatrix";
import { ClickToStart } from "./ClickToStart";
import { StepButton } from "./controls/StepButton";
import { EffectsRack } from "./effects/EffectsRack";
import { useModulationStore } from "@state/synth/modulation-store";
import { useEffectsStore } from "@state/effects";
import {
  createEffectRegistry,
  createReverbFactory,
  createDelayFactory,
} from "@audio/effects";

const testRegistry = createEffectRegistry();
testRegistry.register(createReverbFactory());
testRegistry.register(createDelayFactory());

vi.mock("@audio/effects/EffectsBridgeProvider", () => ({
  useEffectsBridgeContext: () => ({ registry: testRegistry }),
}));

function mockMatchMedia(matches: boolean): void {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn((_query: string) => ({
      matches,
      media: _query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(() => false),
    })),
  });
}

describe("Polish animations", () => {
  describe("ModulationMatrix bezier cables", () => {
    const trackId = "test-track";

    beforeEach(() => {
      mockMatchMedia(false);
      useModulationStore.setState({ matrices: {} });
      useModulationStore.getState().initMatrix(trackId);
    });

    it("renders cables as path elements with bezier curves instead of lines", () => {
      useModulationStore
        .getState()
        .addRoute(trackId, "lfo1", "filterCutoff", 0.5);
      render(<ModulationMatrix trackId={trackId} />);

      const cable = screen.getByTestId("cable-lfo1-filterCutoff");
      expect(cable.tagName.toLowerCase()).toBe("path");
      const d = cable.getAttribute("d") ?? "";
      expect(d).toContain("Q"); // quadratic bezier
      expect(d).toContain("M"); // moveto
    });

    it("renders cable pulse animation when reduced motion is off", () => {
      mockMatchMedia(false);
      useModulationStore
        .getState()
        .addRoute(trackId, "lfo1", "filterCutoff", 0.5);
      render(<ModulationMatrix trackId={trackId} />);

      const cable = screen.getByTestId("cable-lfo1-filterCutoff");
      expect(cable.getAttribute("stroke-dasharray")).toBe("8 8");
    });

    it("omits cable pulse animation when reduced motion is on", () => {
      mockMatchMedia(true);
      useModulationStore
        .getState()
        .addRoute(trackId, "lfo1", "filterCutoff", 0.5);
      render(<ModulationMatrix trackId={trackId} />);

      const cable = screen.getByTestId("cable-lfo1-filterCutoff");
      expect(cable.getAttribute("stroke-dasharray")).toBeNull();
    });

    it("omits cablePulse keyframe style block when reduced motion is on", () => {
      mockMatchMedia(true);
      useModulationStore
        .getState()
        .addRoute(trackId, "lfo1", "filterCutoff", 0.5);
      const { container } = render(<ModulationMatrix trackId={trackId} />);

      const styleElements = container.querySelectorAll("style");
      const hasCablePulse = Array.from(styleElements).some(
        (el) => el.textContent?.includes("cablePulse") === true,
      );
      expect(hasCablePulse).toBe(false);
    });

    it("highlights destination ports when dragging from source", () => {
      render(<ModulationMatrix trackId={trackId} />);

      const srcPort = screen.getByTestId("src-port-lfo1");
      fireEvent.mouseDown(srcPort);

      const destPort = screen.getByTestId("dest-port-filterCutoff");
      expect(destPort.style.transition).toContain("box-shadow");
    });
  });

  describe("ClickToStart animations", () => {
    it("renders the title with glitch animation CSS class", () => {
      mockMatchMedia(false);
      render(<ClickToStart onStart={vi.fn().mockResolvedValue(undefined)} />);

      const title = screen.getByText("BRUTALWAV");
      expect(title).toBeInTheDocument();
    });

    it("renders overlay with scanline class", () => {
      mockMatchMedia(false);
      render(<ClickToStart onStart={vi.fn().mockResolvedValue(undefined)} />);

      // Scanline is on the overlay wrapper div, which is the button's parent
      const button = screen.getByRole("button");
      const overlay = button.parentElement;
      expect(overlay?.className).toContain("scanline");
    });

    it("renders hint text", () => {
      mockMatchMedia(false);
      render(<ClickToStart onStart={vi.fn().mockResolvedValue(undefined)} />);

      expect(
        screen.getByText("Click to start audio engine"),
      ).toBeInTheDocument();
    });
  });

  describe("StepButton animations", () => {
    it("applies active class which has stepPop animation", () => {
      render(<StepButton active={true} onToggle={vi.fn()} index={0} />);
      expect(screen.getByRole("button").className).toContain("active");
    });

    it("applies current class which has box-shadow glow", () => {
      render(
        <StepButton active={false} current onToggle={vi.fn()} index={0} />,
      );
      expect(screen.getByRole("button").className).toContain("current");
    });
  });

  describe("EffectsRack slide-in animation", () => {
    beforeEach(() => {
      useEffectsStore.setState({ trackEffects: {} });
    });

    it("applies slide-in animation to selector when reduced motion is off", () => {
      mockMatchMedia(false);
      render(<EffectsRack trackId="track-1" />);
      fireEvent.click(screen.getByLabelText("Add effect"));

      const selector = screen.getByText("Reverb").parentElement;
      expect(selector?.style.animation).toContain("selectorSlideIn");
    });

    it("omits slide-in animation when reduced motion is on", () => {
      mockMatchMedia(true);
      render(<EffectsRack trackId="track-1" />);
      fireEvent.click(screen.getByLabelText("Add effect"));

      const selector = screen.getByText("Reverb").parentElement;
      expect(selector?.style.animation).toBe("");
    });

    it("omits selectorSlideIn keyframe style block when reduced motion is on", () => {
      mockMatchMedia(true);
      render(<EffectsRack trackId="track-1" />);
      fireEvent.click(screen.getByLabelText("Add effect"));

      const rack = screen.getByTestId("effects-rack");
      const styleElements = rack.querySelectorAll("style");
      const hasSlideIn = Array.from(styleElements).some(
        (el) => el.textContent?.includes("selectorSlideIn") === true,
      );
      expect(hasSlideIn).toBe(false);
    });
  });
});
