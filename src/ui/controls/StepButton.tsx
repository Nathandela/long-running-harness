import styles from "./StepButton.module.css";

type StepButtonProps = {
  active: boolean;
  current?: boolean;
  onToggle: () => void;
  index: number;
};

export function StepButton({
  active,
  current = false,
  onToggle,
  index,
}: StepButtonProps): React.JSX.Element {
  const classes = [
    styles["step"],
    active ? styles["active"] : undefined,
    current ? styles["current"] : undefined,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type="button"
      className={classes}
      aria-pressed={active}
      aria-label={`Step ${String(index + 1)}`}
      onClick={onToggle}
    />
  );
}
