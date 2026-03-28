import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeAll } from "vitest";
import { Modal } from "./Modal";

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = vi.fn();
  HTMLDialogElement.prototype.close = vi.fn();
});

describe("Modal", () => {
  it("renders a dialog element when open", () => {
    render(
      <Modal open={true} onClose={vi.fn()} title="Test">
        Content
      </Modal>,
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("shows the title text", () => {
    render(
      <Modal open={true} onClose={vi.fn()} title="My Title">
        Content
      </Modal>,
    );
    expect(screen.getByText("My Title")).toBeInTheDocument();
  });

  it("shows children content", () => {
    render(
      <Modal open={true} onClose={vi.fn()} title="Test">
        <p>Hello World</p>
      </Modal>,
    );
    expect(screen.getByText("Hello World")).toBeInTheDocument();
  });

  it("calls onClose when dialog close event fires", () => {
    const onClose = vi.fn();
    render(
      <Modal open={true} onClose={onClose} title="Test">
        Content
      </Modal>,
    );
    screen.getByRole("dialog").dispatchEvent(new Event("close"));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("dialog is not visible when open is false", () => {
    render(
      <Modal open={false} onClose={vi.fn()} title="Test">
        Content
      </Modal>,
    );
    const dialog = screen.getByTestId("modal-dialog");
    expect(dialog).not.toHaveAttribute("open");
  });
});
