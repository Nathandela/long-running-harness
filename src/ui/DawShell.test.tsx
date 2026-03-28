import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { DawShell } from "./DawShell";

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
