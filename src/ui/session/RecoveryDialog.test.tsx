import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RecoveryDialog } from "./RecoveryDialog";

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = vi.fn();
  HTMLDialogElement.prototype.close = vi.fn();
});

describe("RecoveryDialog", () => {
  it("renders warning messages", () => {
    render(
      <RecoveryDialog
        open={true}
        warnings={["Invalid transport section", "Missing meta"]}
        onAccept={vi.fn()}
        onDiscard={vi.fn()}
      />,
    );
    expect(screen.getByText("Invalid transport section")).toBeDefined();
    expect(screen.getByText("Missing meta")).toBeDefined();
  });

  it("calls onAccept when continue button clicked", async () => {
    const onAccept = vi.fn();
    render(
      <RecoveryDialog
        open={true}
        warnings={["Some warning"]}
        onAccept={onAccept}
        onDiscard={vi.fn()}
      />,
    );
    await userEvent.click(screen.getByText("Continue with recovered session"));
    expect(onAccept).toHaveBeenCalledTimes(1);
  });

  it("calls onDiscard when start fresh button clicked", async () => {
    const onDiscard = vi.fn();
    render(
      <RecoveryDialog
        open={true}
        warnings={["Some warning"]}
        onAccept={vi.fn()}
        onDiscard={onDiscard}
      />,
    );
    await userEvent.click(screen.getByText("Start fresh"));
    expect(onDiscard).toHaveBeenCalledTimes(1);
  });
});
