import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { createRef } from "react";
import { Button } from "./Button";

describe("Button", () => {
  it("renders with default variant and size", () => {
    render(<Button>Click me</Button>);
    const button = screen.getByRole("button", { name: "Click me" });
    expect(button).toBeInTheDocument();
    expect(button.className).toContain("secondary");
    expect(button.className).toContain("md");
  });

  describe("variants", () => {
    it("renders primary variant", () => {
      render(<Button variant="primary">Primary</Button>);
      const button = screen.getByRole("button");
      expect(button.className).toContain("primary");
    });

    it("renders secondary variant", () => {
      render(<Button variant="secondary">Secondary</Button>);
      const button = screen.getByRole("button");
      expect(button.className).toContain("secondary");
    });

    it("renders ghost variant", () => {
      render(<Button variant="ghost">Ghost</Button>);
      const button = screen.getByRole("button");
      expect(button.className).toContain("ghost");
    });
  });

  describe("sizes", () => {
    it("renders sm size", () => {
      render(<Button size="sm">Small</Button>);
      const button = screen.getByRole("button");
      expect(button.className).toContain("sm");
    });

    it("renders md size", () => {
      render(<Button size="md">Medium</Button>);
      const button = screen.getByRole("button");
      expect(button.className).toContain("md");
    });

    it("renders lg size", () => {
      render(<Button size="lg">Large</Button>);
      const button = screen.getByRole("button");
      expect(button.className).toContain("lg");
    });
  });

  it("calls onClick handler", () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click</Button>);
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("does not call onClick when disabled", () => {
    const onClick = vi.fn();
    render(
      <Button onClick={onClick} disabled>
        Disabled
      </Button>,
    );
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).not.toHaveBeenCalled();
  });

  it("has native disabled attribute when disabled", () => {
    render(<Button disabled>Disabled</Button>);
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
  });

  it("forwards refs", () => {
    const ref = createRef<HTMLButtonElement>();
    render(<Button ref={ref}>Ref</Button>);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it("forwards additional HTML button props", () => {
    render(
      <Button type="submit" data-testid="custom-btn" aria-label="Submit form">
        Submit
      </Button>,
    );
    const button = screen.getByTestId("custom-btn");
    expect(button).toHaveAttribute("type", "submit");
    expect(button).toHaveAttribute("aria-label", "Submit form");
  });
});
