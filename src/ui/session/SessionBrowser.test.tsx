import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SessionBrowser } from "./SessionBrowser";
import { createInMemorySessionStorage } from "@state/session/index";

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = vi.fn();
  HTMLDialogElement.prototype.close = vi.fn();
});

describe("SessionBrowser", () => {
  it("shows empty state when no sessions", async () => {
    const storage = createInMemorySessionStorage();
    render(
      <SessionBrowser
        open={true}
        storage={storage}
        onLoad={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(await screen.findByText("No saved sessions")).toBeDefined();
  });

  it("lists saved sessions", async () => {
    const storage = createInMemorySessionStorage();
    await storage.putSession("s1", "My Song", "{}");
    await storage.putSession("s2", "Another", "{}");
    render(
      <SessionBrowser
        open={true}
        storage={storage}
        onLoad={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(await screen.findByText("My Song")).toBeDefined();
    expect(screen.getByText("Another")).toBeDefined();
  });

  it("calls onLoad with correct id", async () => {
    const storage = createInMemorySessionStorage();
    await storage.putSession("s1", "My Song", "{}");
    const onLoad = vi.fn();
    render(
      <SessionBrowser
        open={true}
        storage={storage}
        onLoad={onLoad}
        onClose={vi.fn()}
      />,
    );
    await screen.findByText("My Song");
    await userEvent.click(screen.getByTestId("load-s1"));
    expect(onLoad).toHaveBeenCalledWith("s1");
  });

  it("deletes a session after confirmation", async () => {
    const storage = createInMemorySessionStorage();
    await storage.putSession("s1", "My Song", "{}");
    render(
      <SessionBrowser
        open={true}
        storage={storage}
        onLoad={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    await screen.findByText("My Song");
    await userEvent.click(screen.getByTestId("delete-s1"));
    // Confirmation prompt appears
    expect(screen.getByTestId("delete-confirm")).toBeDefined();
    expect(screen.getByText(/delete session/i)).toBeDefined();
    // Confirm the deletion
    await userEvent.click(screen.getByTestId("confirm-delete"));
    expect(await screen.findByText("No saved sessions")).toBeDefined();
  });

  it("cancels session deletion", async () => {
    const storage = createInMemorySessionStorage();
    await storage.putSession("s1", "My Song", "{}");
    render(
      <SessionBrowser
        open={true}
        storage={storage}
        onLoad={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    await screen.findByText("My Song");
    await userEvent.click(screen.getByTestId("delete-s1"));
    expect(screen.getByTestId("delete-confirm")).toBeDefined();
    // Cancel the deletion
    await userEvent.click(screen.getByTestId("cancel-delete"));
    // Session is still visible
    expect(screen.getByText("My Song")).toBeDefined();
  });

  it("shows error when listSessions fails", async () => {
    const storage = createInMemorySessionStorage();
    vi.spyOn(storage, "listSessions").mockRejectedValue(new Error("IDB error"));
    render(
      <SessionBrowser
        open={true}
        storage={storage}
        onLoad={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(await screen.findByText("Failed to load sessions.")).toBeDefined();
    expect(screen.getByRole("button", { name: /retry/i })).toBeDefined();
  });

  it("shows error when deleteSession fails", async () => {
    const storage = createInMemorySessionStorage();
    await storage.putSession("s1", "My Song", "{}");
    vi.spyOn(storage, "deleteSession").mockRejectedValue(
      new Error("IDB error"),
    );
    render(
      <SessionBrowser
        open={true}
        storage={storage}
        onLoad={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    await screen.findByText("My Song");
    await userEvent.click(screen.getByTestId("delete-s1"));
    // Confirm the deletion
    await userEvent.click(screen.getByTestId("confirm-delete"));
    expect(await screen.findByText("Failed to delete session.")).toBeDefined();
  });
});
