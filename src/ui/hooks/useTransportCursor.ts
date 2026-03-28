/**
 * Reads cursor position from SharedArrayBuffer at 60fps via requestAnimationFrame.
 * Bypasses React state entirely (NFR-13) -- returns a ref that updates every frame.
 */

import { useEffect, useRef } from "react";
import { TransportLayout } from "@audio/shared-buffer-layout";

export function useTransportCursor(
  transportSAB: SharedArrayBuffer | null,
): React.RefObject<number> {
  const cursorRef = useRef(0);

  useEffect(() => {
    if (transportSAB === null) return;

    const view = new Float64Array(
      transportSAB,
      TransportLayout.CURSOR_SECONDS,
      1,
    );
    let rafId = 0;

    function tick(): void {
      const val = view[0];
      if (val !== undefined) {
        cursorRef.current = val;
      }
      rafId = requestAnimationFrame(tick);
    }

    rafId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [transportSAB]);

  return cursorRef;
}
