import { useState, useEffect } from "react";

const QUERY = "(max-width: 767px)";

export function useIsMobile(): boolean {
  const [mobile, setMobile] = useState<boolean>(
    () => window.matchMedia(QUERY).matches,
  );

  useEffect(() => {
    const mql = window.matchMedia(QUERY);
    const handler = (e: { matches: boolean }): void => {
      setMobile(e.matches);
    };
    mql.addEventListener("change", handler);
    return (): void => {
      mql.removeEventListener("change", handler);
    };
  }, []);

  return mobile;
}
