import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ContextMenu } from "./ContextMenu";

const defaultItems = [
  { label: "Cut", action: vi.fn(), shortcut: "Cmd+X" },
  { label: "Copy", action: vi.fn(), shortcut: "Cmd+C" },
  { label: "Paste", action: vi.fn() },
  { label: "Delete", action: vi.fn(), disabled: true as const },
];

function renderMenu(): { trigger: HTMLElement } {
  render(
    <ContextMenu items={defaultItems}>
      <div data-testid="trigger">Right-click me</div>
    </ContextMenu>,
  );
  return { trigger: screen.getByTestId("trigger") };
}

describe("ContextMenu", () => {
  it("does not show menu by default", () => {
    renderMenu();
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("shows menu on contextmenu event", () => {
    const { trigger } = renderMenu();
    fireEvent.contextMenu(trigger);
    expect(screen.getByRole("menu")).toBeInTheDocument();
  });

  it("menu has role='menu'", () => {
    const { trigger } = renderMenu();
    fireEvent.contextMenu(trigger);
    const menu = screen.getByRole("menu");
    expect(menu).toBeInTheDocument();
  });

  it("items have role='menuitem'", () => {
    const { trigger } = renderMenu();
    fireEvent.contextMenu(trigger);
    const items = screen.getAllByRole("menuitem");
    expect(items).toHaveLength(4);
  });

  it("calls item action on click", () => {
    const action = vi.fn();
    render(
      <ContextMenu items={[{ label: "Do thing", action }]}>
        <div data-testid="trigger">Right-click</div>
      </ContextMenu>,
    );
    fireEvent.contextMenu(screen.getByTestId("trigger"));
    fireEvent.click(screen.getByRole("menuitem", { name: "Do thing" }));
    expect(action).toHaveBeenCalledOnce();
  });

  it("closes menu after clicking an item", () => {
    const action = vi.fn();
    render(
      <ContextMenu items={[{ label: "Do thing", action }]}>
        <div data-testid="trigger">Right-click</div>
      </ContextMenu>,
    );
    fireEvent.contextMenu(screen.getByTestId("trigger"));
    fireEvent.click(screen.getByRole("menuitem", { name: "Do thing" }));
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("closes on Escape key", () => {
    const { trigger } = renderMenu();
    fireEvent.contextMenu(trigger);
    expect(screen.getByRole("menu")).toBeInTheDocument();
    fireEvent.keyDown(screen.getByRole("menu"), { key: "Escape" });
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("disabled items have aria-disabled", () => {
    const { trigger } = renderMenu();
    fireEvent.contextMenu(trigger);
    const deleteItem = screen.getByRole("menuitem", { name: /Delete/ });
    expect(deleteItem).toHaveAttribute("aria-disabled", "true");
  });

  it("disabled items do not call action", () => {
    const action = vi.fn();
    render(
      <ContextMenu items={[{ label: "Nope", action, disabled: true as const }]}>
        <div data-testid="trigger">Right-click</div>
      </ContextMenu>,
    );
    fireEvent.contextMenu(screen.getByTestId("trigger"));
    fireEvent.click(screen.getByRole("menuitem", { name: "Nope" }));
    expect(action).not.toHaveBeenCalled();
  });

  it("closes when clicking outside", () => {
    const { trigger } = renderMenu();
    fireEvent.contextMenu(trigger);
    expect(screen.getByRole("menu")).toBeInTheDocument();
    fireEvent.click(document.body);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("displays shortcut text when provided", () => {
    const { trigger } = renderMenu();
    fireEvent.contextMenu(trigger);
    expect(screen.getByText("Cmd+X")).toBeInTheDocument();
    expect(screen.getByText("Cmd+C")).toBeInTheDocument();
  });

  it("renders children as the trigger area", () => {
    renderMenu();
    expect(screen.getByText("Right-click me")).toBeInTheDocument();
  });
});
