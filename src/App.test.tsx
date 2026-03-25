import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { App } from "./App";

describe("App", () => {
  it("renders the daw root element", () => {
    const { container } = render(<App />);
    expect(container.querySelector("#daw-root")).toBeInTheDocument();
  });
});
