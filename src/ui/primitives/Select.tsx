import styles from "./Select.module.css";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: Array<SelectOption>;
  label: string;
  disabled?: boolean;
}

export function Select({
  value,
  onChange,
  options,
  label,
  disabled,
}: SelectProps): React.JSX.Element {
  return (
    <div className={styles["container"]}>
      <span className={styles["label"]}>{label}</span>
      <div className={styles["wrapper"]}>
        <select
          className={styles["select"]}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
          }}
          disabled={disabled}
          aria-label={label}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <span className={styles["arrow"]} aria-hidden="true">
          V
        </span>
      </div>
    </div>
  );
}
