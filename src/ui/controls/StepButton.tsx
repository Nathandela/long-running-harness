import { forwardRef } from "react";
import styles from "./StepButton.module.css";

type StepButtonProps = {
  active: boolean;
  current?: boolean;
  onToggle: () => void;
  index: number;
  tabIndex?: number;
  onArrowNav?: (direction: -1 | 1) => void;
};

export const StepButton = forwardRef<HTMLButtonElement, StepButtonProps>(
  function StepButton(
    { active, current = false, onToggle, index, tabIndex, onArrowNav },
    ref,
  ) {
    const classes = [
      styles["step"],
      active ? styles["active"] : undefined,
      current ? styles["current"] : undefined,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <button
        ref={ref}
        type="button"
        className={classes}
        aria-pressed={active}
        aria-label={`Step ${String(index + 1)}`}
        tabIndex={tabIndex}
        onClick={onToggle}
        onKeyDown={(e) => {
          if (onArrowNav) {
            if (e.key === "ArrowRight") {
              e.preventDefault();
              onArrowNav(1);
            } else if (e.key === "ArrowLeft") {
              e.preventDefault();
              onArrowNav(-1);
            }
          }
        }}
      />
    );
  },
);
