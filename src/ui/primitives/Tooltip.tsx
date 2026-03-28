import { cloneElement, useId, useState } from "react";
import styles from "./Tooltip.module.css";

type Placement = "top" | "bottom" | "left" | "right";

interface TooltipProps {
  content: string;
  placement?: Placement;
  children: React.ReactElement;
}

export function Tooltip({
  content,
  placement = "top",
  children,
}: TooltipProps): React.JSX.Element {
  const [visible, setVisible] = useState(false);
  const tooltipId = useId();

  const show = (): void => {
    setVisible(true);
  };
  const hide = (): void => {
    setVisible(false);
  };

  const child = cloneElement(children, {
    "aria-describedby": visible ? tooltipId : undefined,
  });

  const tooltipClass = [styles["tooltip"], styles[placement]]
    .filter(Boolean)
    .join(" ");

  return (
    <span
      className={styles["wrapper"]}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {child}
      {visible && (
        <span id={tooltipId} role="tooltip" className={tooltipClass}>
          {content}
        </span>
      )}
    </span>
  );
}
