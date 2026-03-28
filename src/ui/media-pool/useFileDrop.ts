import { useCallback, useState } from "react";

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

  const onDragEnter = useCallback((e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragOver = useCallback((e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent<HTMLElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      const files = [...(e.dataTransfer.files as unknown as File[])];
      onFiles(files);
    },
    [onFiles],
  );

  return {
    isDragging,
    handlers: { onDragEnter, onDragOver, onDragLeave, onDrop },
  };
}
