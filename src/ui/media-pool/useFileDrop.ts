import { useCallback, useRef, useState } from "react";

type DragHandlers = {
  onDragEnter: (e: React.DragEvent<HTMLElement>) => void;
  onDragOver: (e: React.DragEvent<HTMLElement>) => void;
  onDragLeave: (e: React.DragEvent<HTMLElement>) => void;
  onDrop: (e: React.DragEvent<HTMLElement>) => void;
};

type UseFileDropReturn = {
  isDragging: boolean;
  handlers: DragHandlers;
};

export function useFileDrop(
  onFiles: (files: File[]) => void,
): UseFileDropReturn {
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);

  const onDragEnter = useCallback((e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    dragCounter.current++;
    setIsDragging(true);
  }, []);

  const onDragOver = useCallback((e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    dragCounter.current--;
    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
      setIsDragging(false);
    }
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLElement>) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter.current = 0;
      setIsDragging(false);
      const files = Array.from(e.dataTransfer.files);
      onFiles(files);
    },
    [onFiles],
  );

  return {
    isDragging,
    handlers: { onDragEnter, onDragOver, onDragLeave, onDrop },
  };
}
