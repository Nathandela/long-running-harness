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

  it("deletes a session", async () => {
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
    expect(await screen.findByText("No saved sessions")).toBeDefined();
  });
});
