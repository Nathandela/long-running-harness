import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { ErrorBoundary } from "./ErrorBoundary";

afterEach(() => {
  vi.restoreAllMocks();
});

function ThrowingChild({ error }: { error: Error }): React.JSX.Element {
  throw error;
}

function GoodChild(): React.JSX.Element {
  return <div data-testid="good-child">OK</div>;
}

describe("ErrorBoundary", () => {
  it("renders children when no error is thrown", () => {
    render(
      <ErrorBoundary>
        <GoodChild />
      </ErrorBoundary>,
    );
    expect(screen.getByTestId("good-child")).toBeInTheDocument();
  });

  it("renders fallback UI when a child throws", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <ErrorBoundary>
        <ThrowingChild error={new Error("boom")} />
      </ErrorBoundary>,
    );
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
  });

  it("shows the error message in fallback UI", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <ErrorBoundary>
        <ThrowingChild error={new Error("test error details")} />
      </ErrorBoundary>,
    );
    expect(screen.getByText(/test error details/)).toBeInTheDocument();
  });

  it("provides a reload button", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const reloadMock = vi.fn();
    Object.defineProperty(window, "location", {
      value: { reload: reloadMock },
      writable: true,
    });
    render(
      <ErrorBoundary>
        <ThrowingChild error={new Error("crash")} />
      </ErrorBoundary>,
    );
    const reloadBtn = screen.getByRole("button", { name: /reload/i });
    fireEvent.click(reloadBtn);
    expect(reloadMock).toHaveBeenCalledTimes(1);
  });

  it("uses custom fallbackLabel when provided", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <ErrorBoundary fallbackLabel="Panel crashed">
        <ThrowingChild error={new Error("oops")} />
      </ErrorBoundary>,
    );
    expect(screen.getByText(/panel crashed/i)).toBeInTheDocument();
  });
});
