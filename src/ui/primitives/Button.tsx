import { forwardRef } from "react";
import styles from "./Button.module.css";

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "disabled">;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { variant = "secondary", size = "md", disabled = false, className, onClick, ...rest },
    ref,
  ): React.JSX.Element {
    const classes = [
      styles["button"],
      styles[variant],
      styles[size],
      disabled ? styles["disabled"] : undefined,
      className,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <button
        ref={ref}
        className={classes}
        aria-disabled={disabled ? "true" : undefined}
        onClick={disabled ? undefined : onClick}
        {...rest}
      />
    );
  },
);
