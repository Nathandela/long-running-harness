import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { CrossOriginError } from "./CrossOriginError";

describe("CrossOriginError", () => {
  it("renders an alert with required header information", () => {
    render(<CrossOriginError />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(
      screen.getByText("Cross-Origin Isolation Required"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Cross-Origin-Opener-Policy: same-origin/),
    ).toBeInTheDocument();
  });
});
