import { useEffect, useState } from "react";
import styles from "./ActionToast.module.css";

const TOAST_DURATION = 1200;
const FADE_DURATION = 100;

type ActionToastProps = {
  message: string | null;
};

type Phase = "visible" | "fading" | "hidden";

export function ActionToast({
  message,
}: ActionToastProps): React.JSX.Element | null {
  const [phase, setPhase] = useState<Phase>("hidden");

  useEffect(() => {
    if (message === null) return;
    // Phase starts as "visible" via the setState calls in timeouts below.
    // The initial render after message change shows "visible" because
    // we schedule state transitions:
    const showTimer = setTimeout(() => {
      setPhase("visible");
    }, 0);

    const fadeTimer = setTimeout(() => {
      setPhase("fading");
    }, TOAST_DURATION - FADE_DURATION);

    const hideTimer = setTimeout(() => {
      setPhase("hidden");
    }, TOAST_DURATION);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, [message]);

  if (phase === "hidden" || message === null) return null;

  const toastClass = styles["toast"] ?? "";
  const hidingClass = styles["hiding"] ?? "";
  const displayText = message.replace(/#\d+$/, "");

  return (
    <div
      className={`${toastClass}${phase === "fading" ? ` ${hidingClass}` : ""}`}
      role="status"
      aria-live="polite"
    >
      {displayText}
    </div>
  );
}
