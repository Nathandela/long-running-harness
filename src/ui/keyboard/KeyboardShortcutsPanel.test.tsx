import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen } from "@testing-library/react";
import { KeyboardShortcutsPanel } from "./KeyboardShortcutsPanel";

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = vi.fn();
  HTMLDialogElement.prototype.close = vi.fn();
});

describe("KeyboardShortcutsPanel", () => {
  it("renders the modal when open", () => {
    render(<KeyboardShortcutsPanel open={true} onClose={vi.fn()} />);
    expect(screen.getByText("Keyboard Shortcuts")).toBeInTheDocument();
  });

  it("shows shortcut entries", () => {
    render(<KeyboardShortcutsPanel open={true} onClose={vi.fn()} />);
    expect(screen.getByText("Space")).toBeInTheDocument();
    expect(screen.getByText("Play / Stop")).toBeInTheDocument();
  });

  it("does not render when closed", () => {
    render(<KeyboardShortcutsPanel open={false} onClose={vi.fn()} />);
    const dialog = screen.getByTestId("modal-dialog");
    expect(dialog).not.toHaveAttribute("open");
  });
});
