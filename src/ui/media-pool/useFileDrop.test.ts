import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { useFileDrop } from "./useFileDrop";

function makeDragEvent(
  type: string,
  files: File[] = [],
): React.DragEvent<HTMLElement> {
  return {
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
    dataTransfer: {
      files,
      types: ["Files"],
    },
    type,
  } as unknown as React.DragEvent<HTMLElement>;
}

describe("useFileDrop", () => {
  it("isDragging is false initially", () => {
    const { result } = renderHook(() => useFileDrop(vi.fn()));
    expect(result.current.isDragging).toBe(false);
  });

  it("isDragging becomes true on dragEnter", () => {
    const { result } = renderHook(() => useFileDrop(vi.fn()));

    act(() => {
      result.current.handlers.onDragEnter(makeDragEvent("dragenter"));
    });

    expect(result.current.isDragging).toBe(true);
  });

  it("isDragging becomes false on dragLeave", () => {
    const { result } = renderHook(() => useFileDrop(vi.fn()));

    act(() => {
      result.current.handlers.onDragEnter(makeDragEvent("dragenter"));
    });
    act(() => {
      result.current.handlers.onDragLeave(makeDragEvent("dragleave"));
    });

    expect(result.current.isDragging).toBe(false);
  });

  it("onDrop calls handler with files", () => {
    const onDrop = vi.fn();
    const { result } = renderHook(() => useFileDrop(onDrop));

    const file = new File(["data"], "kick.wav", { type: "audio/wav" });
    act(() => {
      result.current.handlers.onDrop(makeDragEvent("drop", [file]));
    });

    expect(onDrop).toHaveBeenCalledWith([file]);
    expect(result.current.isDragging).toBe(false);
  });

  it("onDrop prevents default", () => {
    const { result } = renderHook(() => useFileDrop(vi.fn()));
    const evt = makeDragEvent("drop", []);

    act(() => {
      result.current.handlers.onDrop(evt);
    });

    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(evt.preventDefault).toHaveBeenCalled();
  });
});
