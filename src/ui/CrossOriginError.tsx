import styles from "./CrossOriginError.module.css";

export function CrossOriginError(): React.JSX.Element {
  return (
    <div role="alert" className={styles.overlay}>
      <div className={styles.content}>
        <h1 className={styles.title}>Cross-Origin Isolation Required</h1>
        <p className={styles.description}>
          BRUTALWAV requires <code>SharedArrayBuffer</code> for real-time audio
          processing. Your server must set these headers:
        </p>
        <pre className={styles.codeBlock}>
          {`Cross-Origin-Opener-Policy: same-origin\nCross-Origin-Embedder-Policy: require-corp`}
        </pre>
      </div>
    </div>
  );
}
