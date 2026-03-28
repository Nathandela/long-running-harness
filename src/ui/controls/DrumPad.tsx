import styles from "./DrumPad.module.css";

type DrumPadProps = {
  label: string;
  active?: boolean;
  onTrigger: () => void;
  size?: number;
};

export function DrumPad({
  label,
  active = false,
  onTrigger,
  size = 48,
}: DrumPadProps): React.JSX.Element {
  const classes = [styles["pad"], active ? styles["active"] : undefined]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type="button"
      className={classes}
      aria-label={label}
      aria-pressed={active}
      onPointerDown={(e) => {
        if (e.button === 0) onTrigger();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onTrigger();
        }
      }}
      style={size !== 48 ? { width: size, height: size } : undefined}
    >
      {label}
    </button>
  );
}
