import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Tooltip } from "./Tooltip";

describe("Tooltip", () => {
  it("does not show tooltip content by default", () => {
    render(
      <Tooltip content="Help text">
        <button>Hover me</button>
      </Tooltip>,
    );
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("shows tooltip on mouseenter of trigger element", () => {
    render(
      <Tooltip content="Help text">
        <button>Hover me</button>
      </Tooltip>,
    );
    fireEvent.mouseEnter(screen.getByText("Hover me"));
    expect(screen.getByRole("tooltip")).toHaveTextContent("Help text");
  });

  it("hides tooltip on mouseleave", () => {
    render(
      <Tooltip content="Help text">
        <button>Hover me</button>
      </Tooltip>,
    );
    fireEvent.mouseEnter(screen.getByText("Hover me"));
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
    fireEvent.mouseLeave(screen.getByText("Hover me"));
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("tooltip has role='tooltip'", () => {
    render(
      <Tooltip content="Help text">
        <button>Hover me</button>
      </Tooltip>,
    );
    fireEvent.mouseEnter(screen.getByText("Hover me"));
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
  });

  it("trigger has aria-describedby pointing to tooltip id", () => {
    render(
      <Tooltip content="Help text">
        <button>Hover me</button>
      </Tooltip>,
    );
    const trigger = screen.getByText("Hover me");
    fireEvent.mouseEnter(trigger);
    const tooltip = screen.getByRole("tooltip");
    expect(trigger).toHaveAttribute("aria-describedby", tooltip.id);
  });

  it("shows tooltip on focus of trigger element", () => {
    render(
      <Tooltip content="Help text">
        <button>Hover me</button>
      </Tooltip>,
    );
    fireEvent.focus(screen.getByText("Hover me"));
    expect(screen.getByRole("tooltip")).toHaveTextContent("Help text");
  });

  it("hides tooltip on blur", () => {
    render(
      <Tooltip content="Help text">
        <button>Hover me</button>
      </Tooltip>,
    );
    fireEvent.focus(screen.getByText("Hover me"));
    expect(screen.getByRole("tooltip")).toBeInTheDocument();
    fireEvent.blur(screen.getByText("Hover me"));
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  });

  it("defaults placement to top", () => {
    render(
      <Tooltip content="Help text">
        <button>Hover me</button>
      </Tooltip>,
    );
    fireEvent.mouseEnter(screen.getByText("Hover me"));
    const tooltip = screen.getByRole("tooltip");
    expect(tooltip.className).toContain("top");
  });

  it("applies the specified placement class", () => {
    render(
      <Tooltip content="Help text" placement="bottom">
        <button>Hover me</button>
      </Tooltip>,
    );
    fireEvent.mouseEnter(screen.getByText("Hover me"));
    const tooltip = screen.getByRole("tooltip");
    expect(tooltip.className).toContain("bottom");
  });
});
