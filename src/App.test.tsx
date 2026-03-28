import { render, screen, fireEvent, act, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { App } from "./App";
import { useDawStore } from "@state/store";

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
  useDawStore.setState({ engineStatus: "uninitialized" });
});

afterEach(() => {
  cleanup();
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

  it("shows DAW shell after clicking start", async () => {
    vi.stubGlobal("crossOriginIsolated", true);
    render(<App />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button"));
      await Promise.resolve();
    });
    expect(screen.getByTestId("daw-shell")).toBeInTheDocument();
    expect(useDawStore.getState().engineStatus).toBe("running");
  });

  it("sets engine status to error when resume() rejects", async () => {
    vi.stubGlobal("crossOriginIsolated", true);
    vi.stubGlobal(
      "AudioContext",
      class extends MockAudioContext {
        override resume(): Promise<void> {
          return Promise.reject(new Error("autoplay blocked"));
        }
      },
    );
    render(<App />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button"));
      await Promise.resolve();
    });
    expect(useDawStore.getState().engineStatus).toBe("error");
    expect(screen.getByText("BRUTALWAV")).toBeInTheDocument();
  });

  it("sets engine status to error when AudioContext constructor throws", () => {
    vi.stubGlobal("crossOriginIsolated", true);
    vi.stubGlobal("AudioContext", vi.fn(() => {
      throw new Error("Web Audio not supported");
    }));
    render(<App />);
    act(() => {
      fireEvent.click(screen.getByRole("button"));
    });
    expect(useDawStore.getState().engineStatus).toBe("error");
    expect(screen.getByText("BRUTALWAV")).toBeInTheDocument();
  });

  it("does not create a second AudioContext on double-click", async () => {
    vi.stubGlobal("crossOriginIsolated", true);
    const constructorSpy = vi.fn();
    vi.stubGlobal(
      "AudioContext",
      class extends MockAudioContext {
        constructor() {
          super();
          constructorSpy();
        }
      },
    );
    render(<App />);
    const button = screen.getByRole("button");
    await act(async () => {
      fireEvent.click(button);
      fireEvent.click(button);
      await Promise.resolve();
    });
    expect(constructorSpy).toHaveBeenCalledTimes(1);
  });

  it("closes AudioContext when resume() rejects", async () => {
    vi.stubGlobal("crossOriginIsolated", true);
    const closeSpy = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal(
      "AudioContext",
      class extends MockAudioContext {
        override resume(): Promise<void> {
          return Promise.reject(new Error("autoplay blocked"));
        }
        override close(): Promise<void> {
          closeSpy();
          return Promise.resolve();
        }
      },
    );
    render(<App />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button"));
      await Promise.resolve();
    });
    expect(closeSpy).toHaveBeenCalledTimes(1);
  });

  it("does not update state if unmounted while resume() is in flight", async () => {
    vi.stubGlobal("crossOriginIsolated", true);
    let resolveResume: (() => void) | undefined;
    const resumePromise = new Promise<void>((r) => { resolveResume = r; });
    const closeSpy = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal(
      "AudioContext",
      class extends MockAudioContext {
        override resume(): Promise<void> {
          return resumePromise;
        }
        override close(): Promise<void> {
          closeSpy();
          return Promise.resolve();
        }
      },
    );
    const { unmount } = render(<App />);
    act(() => {
      fireEvent.click(screen.getByRole("button"));
    });
    unmount();
    await act(async () => {
      resolveResume?.();
      await Promise.resolve();
    });
    expect(closeSpy).toHaveBeenCalledTimes(1);
    expect(useDawStore.getState().engineStatus).not.toBe("running");
  });
});
