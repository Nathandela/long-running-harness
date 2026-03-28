import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { DawShell } from "./DawShell";

vi.mock("@audio/use-transport", () => ({
  useTransport: (): object => ({
    play: vi.fn(),
    pause: vi.fn(),
    stop: vi.fn(),
    seek: vi.fn(),
    setBpm: vi.fn(),
    setMetronomeEnabled: vi.fn(),
    getTransportSAB: vi.fn().mockReturnValue(null),
    getClock: vi.fn().mockReturnValue(null),
  }),
}));

vi.mock("@ui/hooks/useTransportCursor", () => ({
  useTransportCursor: (): { current: number } => ({ current: 0 }),
}));

describe("DawShell", () => {
  it("renders the complete layout structure", () => {
    render(<DawShell />);
    expect(screen.getByTestId("daw-shell")).toBeInTheDocument();
    expect(screen.getByTestId("toolbar")).toBeInTheDocument();
    expect(screen.getByTestId("arrangement-panel")).toBeInTheDocument();
    expect(screen.getByTestId("mixer-panel")).toBeInTheDocument();
    expect(screen.getByTestId("instrument-panel")).toBeInTheDocument();
  });
});
