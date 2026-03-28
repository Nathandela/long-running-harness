import styles from "./Toggle.module.css";

type ToggleProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
};

export function Toggle({
  checked,
  onChange,
  label,
  disabled,
}: ToggleProps): React.JSX.Element {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      className={styles["toggle"]}
      onClick={() => {
        onChange(!checked);
      }}
    >
      <span className={styles["thumb"]} />
    </button>
  );
}
