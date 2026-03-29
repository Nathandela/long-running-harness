import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ModulationMatrix } from "./ModulationMatrix";
import { useModulationStore } from "@state/synth/modulation-store";

describe("ModulationMatrix", () => {
  const trackId = "test-track";

  beforeEach(() => {
    useModulationStore.setState({ matrices: {} });
    useModulationStore.getState().initMatrix(trackId);
  });

  it("renders the modulation matrix panel", () => {
    render(<ModulationMatrix trackId={trackId} />);
    expect(screen.getByTestId("mod-matrix")).toBeDefined();
  });

  it("renders all 8 sources", () => {
    render(<ModulationMatrix trackId={trackId} />);
    expect(screen.getByText("LFO 1")).toBeDefined();
    expect(screen.getByText("LFO 2")).toBeDefined();
    expect(screen.getByText("Amp Env")).toBeDefined();
    expect(screen.getByText("Filter Env")).toBeDefined();
    expect(screen.getByText("Velocity")).toBeDefined();
    expect(screen.getByText("Aftertouch")).toBeDefined();
    expect(screen.getByText("Mod Wheel")).toBeDefined();
    expect(screen.getByText("Pitch Bend")).toBeDefined();
  });

  it("renders all 8 destinations", () => {
    render(<ModulationMatrix trackId={trackId} />);
    expect(screen.getByText("Osc 1 Pitch")).toBeDefined();
    expect(screen.getByText("Osc 2 Pitch")).toBeDefined();
    expect(screen.getByText("Osc Mix")).toBeDefined();
    expect(screen.getByText("Filter Cutoff")).toBeDefined();
    expect(screen.getByText("Filter Reso")).toBeDefined();
    expect(screen.getByText("Amp Level")).toBeDefined();
    expect(screen.getByText("LFO 1 Rate")).toBeDefined();
    expect(screen.getByText("LFO 2 Rate")).toBeDefined();
  });

  it("adds a route when source and destination are clicked", () => {
    render(<ModulationMatrix trackId={trackId} />);

    const srcPort = screen.getByTestId("src-port-lfo1");
    const destPort = screen.getByTestId("dest-port-filterCutoff");

    fireEvent.mouseDown(srcPort);
    fireEvent.mouseUp(destPort);

    const routes = useModulationStore.getState().getRoutes(trackId);
    expect(routes).toHaveLength(1);
    expect(routes[0]?.source).toBe("lfo1");
    expect(routes[0]?.destination).toBe("filterCutoff");
  });

  it("renders active routes as cables", () => {
    useModulationStore
      .getState()
      .addRoute(trackId, "lfo1", "filterCutoff", 0.5);
    render(<ModulationMatrix trackId={trackId} />);

    const cable = screen.getByTestId("cable-lfo1-filterCutoff");
    expect(cable).toBeDefined();
  });

  it("renders route amount slider", () => {
    useModulationStore
      .getState()
      .addRoute(trackId, "lfo1", "filterCutoff", 0.5);
    render(<ModulationMatrix trackId={trackId} />);

    const routeId = useModulationStore.getState().getRoutes(trackId)[0]?.id;
    const slider = screen.getByTestId(`route-amount-${routeId ?? ""}`);
    expect(slider).toBeDefined();
  });

  it("removes a route when delete button is clicked", () => {
    useModulationStore
      .getState()
      .addRoute(trackId, "lfo1", "filterCutoff", 0.5);
    render(<ModulationMatrix trackId={trackId} />);

    const routeId = useModulationStore.getState().getRoutes(trackId)[0]?.id;
    const deleteBtn = screen.getByTestId(`route-delete-${routeId ?? ""}`);
    fireEvent.click(deleteBtn);

    expect(useModulationStore.getState().getRoutes(trackId)).toHaveLength(0);
  });

  it("toggles bipolar flag via button", () => {
    useModulationStore
      .getState()
      .addRoute(trackId, "lfo1", "filterCutoff", 0.5);
    render(<ModulationMatrix trackId={trackId} />);

    const routeId = useModulationStore.getState().getRoutes(trackId)[0]?.id;
    const bipolarBtn = screen.getByTestId(`route-bipolar-${routeId ?? ""}`);
    expect(bipolarBtn.textContent).toBe("BI");
    fireEvent.click(bipolarBtn);
    expect(useModulationStore.getState().getRoutes(trackId)[0]?.bipolar).toBe(
      false,
    );
  });

  it("clears drag state on document mouseup (outside component)", () => {
    render(<ModulationMatrix trackId={trackId} />);

    const srcPort = screen.getByTestId("src-port-lfo1");
    fireEvent.mouseDown(srcPort);

    // Mouse up on document (outside component)
    fireEvent.mouseUp(document);

    // Now clicking a destination should NOT create a route
    const destPort = screen.getByTestId("dest-port-filterCutoff");
    fireEvent.mouseUp(destPort);

    expect(useModulationStore.getState().getRoutes(trackId)).toHaveLength(0);
  });

  it("updates route amount via slider", () => {
    useModulationStore
      .getState()
      .addRoute(trackId, "lfo1", "filterCutoff", 0.5);
    render(<ModulationMatrix trackId={trackId} />);

    const routeId = useModulationStore.getState().getRoutes(trackId)[0]?.id;
    const slider = screen.getByTestId(`route-amount-${routeId ?? ""}`);
    fireEvent.change(slider, { target: { value: "0.8" } });

    expect(useModulationStore.getState().getRoutes(trackId)[0]?.amount).toBe(
      0.8,
    );
  });

  describe("keyboard accessibility", () => {
    it("renders ports as focusable buttons with aria-labels", () => {
      render(<ModulationMatrix trackId={trackId} />);
      const srcPort = screen.getByTestId("src-port-lfo1");
      expect(srcPort.tagName).toBe("BUTTON");
      expect(srcPort).toHaveAttribute("aria-label", "Source: LFO 1");

      const destPort = screen.getByTestId("dest-port-filterCutoff");
      expect(destPort.tagName).toBe("BUTTON");
      expect(destPort).toHaveAttribute(
        "aria-label",
        "Destination: Filter Cutoff",
      );
    });

    it("starts keyboard connection on Enter at source port", async () => {
      render(<ModulationMatrix trackId={trackId} />);
      const srcPort = screen.getByTestId("src-port-lfo1");
      srcPort.focus();
      await userEvent.keyboard("{Enter}");

      const matrix = screen.getByTestId("mod-matrix");
      const liveRegion = within(matrix).getByText(/connecting from lfo 1/i);
      expect(liveRegion).toBeInTheDocument();
    });

    it("completes keyboard connection on Enter at destination port", async () => {
      render(<ModulationMatrix trackId={trackId} />);

      // Start connection from source
      const srcPort = screen.getByTestId("src-port-lfo1");
      srcPort.focus();
      await userEvent.keyboard("{Enter}");

      // Complete at destination
      const destPort = screen.getByTestId("dest-port-filterCutoff");
      destPort.focus();
      await userEvent.keyboard("{Enter}");

      // Route created
      const routes = useModulationStore.getState().getRoutes(trackId);
      expect(routes).toHaveLength(1);
      expect(routes[0]?.source).toBe("lfo1");
      expect(routes[0]?.destination).toBe("filterCutoff");

      // Announcement
      const matrix = screen.getByTestId("mod-matrix");
      expect(
        within(matrix).getByText(/connected lfo 1 to filter cutoff/i),
      ).toBeInTheDocument();
    });

    it("cancels keyboard connection on Escape", async () => {
      render(<ModulationMatrix trackId={trackId} />);
      const srcPort = screen.getByTestId("src-port-lfo1");
      srcPort.focus();
      await userEvent.keyboard("{Enter}");

      await userEvent.keyboard("{Escape}");

      const matrix = screen.getByTestId("mod-matrix");
      expect(
        within(matrix).getByText(/connection cancelled/i),
      ).toBeInTheDocument();

      // Clicking destination should not create route
      const destPort = screen.getByTestId("dest-port-filterCutoff");
      destPort.focus();
      await userEvent.keyboard("{Enter}");
      expect(useModulationStore.getState().getRoutes(trackId)).toHaveLength(0);
    });

    it("has aria-live region for announcements", () => {
      render(<ModulationMatrix trackId={trackId} />);
      const matrix = screen.getByTestId("mod-matrix");
      const liveRegion = matrix.querySelector('[aria-live="polite"]');
      expect(liveRegion).toBeTruthy();
    });

    it("route buttons have descriptive aria-labels", () => {
      useModulationStore
        .getState()
        .addRoute(trackId, "lfo1", "filterCutoff", 0.5);
      render(<ModulationMatrix trackId={trackId} />);

      const routeId = useModulationStore.getState().getRoutes(trackId)[0]?.id;
      const bipolarBtn = screen.getByTestId(`route-bipolar-${routeId ?? ""}`);
      expect(bipolarBtn).toHaveAttribute(
        "aria-label",
        "Toggle bipolar mode for LFO 1 to Filter Cutoff",
      );
      expect(bipolarBtn).toHaveAttribute("aria-pressed");

      const deleteBtn = screen.getByTestId(`route-delete-${routeId ?? ""}`);
      expect(deleteBtn).toHaveAttribute(
        "aria-label",
        "Remove route LFO 1 to Filter Cutoff",
      );
    });
  });
});
