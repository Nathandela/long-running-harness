import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { App } from "./App";

class MockAudioContext {
  state: AudioContextState = "suspended";
  readonly audioWorklet = {
    addModule: vi.fn().mockResolvedValue(undefined),
  };
  resume(): Promise<void> {
    this.state = "running";
    return Promise.resolve();
  }
  close(): Promise<void> {
    this.state = "closed";
    return Promise.resolve();
  }
}

beforeEach(() => {
  vi.stubGlobal("AudioContext", MockAudioContext);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("App", () => {
  it("shows error when not cross-origin isolated", () => {
    vi.stubGlobal("crossOriginIsolated", false);
    render(<App />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(
      screen.getByText("Cross-Origin Isolation Required"),
    ).toBeInTheDocument();
  });

  it("shows click-to-start when cross-origin isolated", () => {
    vi.stubGlobal("crossOriginIsolated", true);
    render(<App />);
    expect(screen.getByText("BRUTALWAV")).toBeInTheDocument();
    expect(screen.getByText("Click to start audio engine")).toBeInTheDocument();
  });

  it("shows DAW shell after clicking start", () => {
    vi.stubGlobal("crossOriginIsolated", true);
    render(<App />);
    fireEvent.click(screen.getByRole("button"));
    expect(screen.getByTestId("daw-shell")).toBeInTheDocument();
  });
});
