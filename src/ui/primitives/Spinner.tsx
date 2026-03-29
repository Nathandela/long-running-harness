import styles from "./Spinner.module.css";

export function Spinner(): React.JSX.Element {
  return <span className={styles["spinner"]} aria-label="Loading" />;
}
